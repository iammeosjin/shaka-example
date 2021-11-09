/* eslint-disable no-console */
import { FileUpload } from 'graphql-upload';
import faker from 'faker';
import path from 'path';
import fs from 'fs/promises';
import { promisify } from 'util';
import rimraf from 'rimraf';
import { createWriteStream } from 'fs';
import { Context } from '../../types';
import { FileStatus } from '../../models/file';

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
      const filePath = path.resolve(ctx.config.bucket, id);
      const url = path.resolve(filePath, filename);

      try {
        await fs.access(filePath);
      } catch {
        await fs.mkdir(filePath);
      }

      await new Promise((resolve, reject) => {
        const file = createWriteStream(url);

        stream.pipe(file);
        stream.on('error', async (error: Error) => {
          file.close();
          file.emit('error', error);
        });

        file.on('error', reject);
        file.on('finish', resolve);
      }).catch(async (error) => {
        await promisify(rimraf)(filePath);
        throw error;
      });

      const file = await ctx.models.file.create({
        _id: id,
        fileName: filename,
        mimetype: encoding,
        encoding: mimetype,
        url,
      });

      return { file };
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
      await ctx.models.file.findByIdAndDelete(
        args.id,
      );
      return true;
    },
  },
};
