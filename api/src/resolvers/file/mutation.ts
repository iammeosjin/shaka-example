/* eslint-disable no-console */
import { FileUpload } from 'graphql-upload';
import faker from 'faker';
import path from 'path';
import { promisify } from 'util';
import rimraf from 'rimraf';
import tryToCatch from 'try-to-catch';
import Bluebird from 'bluebird';
import assert from 'assert';
import fs from 'fs/promises';
import { Context } from '../../types';
import { FileStatus } from '../../models/file';
import { writeFile } from '../../library/write-file';
import localQueue from '../../library/local-queue';
import splitVideo from '../../library/split-video';
import { readdir } from '../../library/constants';
import convertVideo from '../../library/convert-video';
import mergeVideos from '../../library/merge-videos';
import packageVideos from '../../library/package-videos';
import createFolder from '../../library/create-folder';
import io from '../../library/socket-io';
import addToIPFSFromFS from '../../library/add-to-ipfs-from-fs';

export default {
  Mutation: {
    async uploadFile(
      _: never,
      args: {
        input: {
          file: Promise<FileUpload>
        }
      },
      ctx: Context,
    ) {
      const {
        createReadStream, mimetype, encoding, filename,
      } = await args.input.file;

      const stream = createReadStream();

      const id = faker.datatype.uuid().replace(/-/g, '');
      const rootPath = path.resolve(ctx.config.bucket, id);

      await createFolder(rootPath);

      const filePath = await writeFile({
        stream,
        filePath: rootPath,
        fileName: filename,
      });

      const file = await ctx.models.file.create({
        _id: id,
        fileName: filename,
        mimetype: encoding,
        encoding: mimetype,
        status: FileStatus.PROCESSING,
      });

      localQueue.add(async () => {
        console.time(`process-video-${id}`);
        const totalProcess = 4;
        let currentProcess = 0;
        let progress = currentProcess / totalProcess;
        const [splitVideoError, segmentedVideosPath] = await tryToCatch(
          splitVideo, { input: filePath, customPath: path.resolve(rootPath, 'segment') },
        );
        await promisify(rimraf)(filePath);
        if (splitVideoError) {
          await promisify(rimraf)(rootPath);
          console.warn('split-video-error');
          await ctx.models.file.findOneAndUpdate(
            { _id: file.id },
            { status: FileStatus.FAILED },
            { new: true },
          );
          io.emit('progress', JSON.stringify({
            id: file.id,
            progress: -1,
          }));
          throw splitVideoError;
        }
        currentProcess = 1;
        progress = currentProcess / totalProcess;
        io.emit('progress', JSON.stringify({
          id: file.id,
          progress,
        }));

        const [convertVideoError, convertedVideosPath] = await tryToCatch(
          async (inputPath: string) => {
            const outputPath = path.resolve(rootPath, 'convert');
            await createFolder(outputPath);
            const files = await readdir(inputPath);

            let bitratePath = path.resolve(outputPath, '360');
            let [error] = await tryToCatch(fs.stat, bitratePath);
            if (error) { await fs.mkdir(bitratePath); }
            bitratePath = path.resolve(outputPath, '480');
            [error] = await tryToCatch(fs.stat, bitratePath);
            if (error) { await fs.mkdir(bitratePath); }
            bitratePath = path.resolve(outputPath, '720');
            [error] = await tryToCatch(fs.stat, bitratePath);
            if (error) { await fs.mkdir(bitratePath); }

            const total = files.length;
            let count = 0;

            io.emit('progress', JSON.stringify({
              id: file.id,
              progress: progress + ((count / total) * 0.1),
              status: FileStatus.CONVERTING,
            }));

            await Bluebird.map(files, async (fileName) => {
              const temp = path.resolve(inputPath, fileName);
              await Promise.all(
                [
                  convertVideo({
                    input: temp,
                    output: outputPath,
                    bitrate: '360',
                  }),
                  convertVideo({
                    input: temp,
                    output: outputPath,
                    bitrate: '480',
                  }),
                  convertVideo({
                    input: temp,
                    output: outputPath,
                    bitrate: '720',
                  }),
                ],
              );
              count += 1;

              io.emit('progress', JSON.stringify({
                id: file.id,
                progress: progress + ((count / total) * 0.1),
                status: FileStatus.CONVERTING,
              }));
            }, { concurrency: 100 });
            return outputPath;
          }, segmentedVideosPath as string,
        );
        await promisify(rimraf)(segmentedVideosPath as string);
        if (convertVideoError) {
          console.warn('convert-video-error');
          await ctx.models.file.findOneAndUpdate(
            { _id: file.id },
            { status: FileStatus.FAILED },
            { new: true },
          );
          throw convertVideoError;
        }

        currentProcess = 2;
        progress = currentProcess / totalProcess;
        io.emit('progress', JSON.stringify({
          id: file.id,
          progress,
        }));

        const [mergeVideosError, mergedVideosResult] = await tryToCatch(mergeVideos, {
          input: convertedVideosPath as string,
          customPath: path.resolve(rootPath, 'merge'),
        });
        await promisify(rimraf)(convertedVideosPath as string);
        if (mergeVideosError) {
          console.warn('merge-video-error');
          await ctx.models.file.findOneAndUpdate(
            { _id: file.id },
            { status: FileStatus.FAILED },
            { new: true },
          );
          throw mergeVideosError;
        }

        assert(mergedVideosResult);
        currentProcess = 3;
        progress = currentProcess / totalProcess;
        io.emit('progress', JSON.stringify({
          id: file.id,
          progress,
        }));

        const drm = {
          id: file.id,
          key: faker.datatype.uuid().replace(/-/g, ''),
        };

        console.log('drm', drm);

        const outputDir = await packageVideos({
          input: mergedVideosResult.videos as string[],
          output: rootPath,
          drm,
        });
        await promisify(rimraf)(mergedVideosResult.path as string);

        const hash = await addToIPFSFromFS(outputDir, id);
        await promisify(rimraf)(outputDir as string);
        if (!hash) {
          await ctx.models.file.findOneAndUpdate(
            { _id: file.id },
            { status: FileStatus.FAILED },
            { new: true },
          );
          return;
        }

        await ctx.models.file.findOneAndUpdate(
          { _id: file.id },
          { status: FileStatus.READY, hash },
          { new: true },
        );

        currentProcess = 4;
        progress = currentProcess / totalProcess;
        io.emit('progress', JSON.stringify({
          id: file.id,
          progress,
        }));
        console.timeEnd(`process-video-${id}`);
      });

      return {
        file,
      };
    },
    async updateFile(
      _: never,
      args: {
        id: string,
        input: {
          status: FileStatus
        }
      },
      ctx: Context,
    ) {
      const file = await ctx.models.file.findOneAndUpdate(
        { _id: args.id },
        args.input,
        { new: true },
      );
      return { file };
    },
    async deleteFile(
      _: never,
      args: {
        id: string,
      },
      ctx: Context,
    ) {
      /*
      const file = await ctx.models.file.findByIdAndDelete(
        args.id,
      );
      if (file && file.url) {
        await promisify(rimraf)(file.url);
      }
      */
      await ctx.models.file.findByIdAndDelete(
        args.id,
      );
      return true;
    },
  },
};
