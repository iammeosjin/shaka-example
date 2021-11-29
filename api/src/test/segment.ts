/* eslint-disable no-console */
import path from 'path';
import Bluebird from 'bluebird';
import fs from 'fs/promises';
import tryToCatch from 'try-to-catch';
import { promisify } from 'util';
import rimraf from 'rimraf';
import assert from 'assert';
import splitVideo from '../library/split-video';
import {
  outputPath,
  readdir,
  rootPath,
  convertedVideosPath as rootConvertedVideosPath,
} from '../library/constants';
import convertVideo from '../library/convert-video';
import mergeVideos from '../library/merge-videos';
import packageVideos from '../library/package-videos';

(async () => {
  console.time('process');
  const filePath = path.resolve(rootPath, 'valid.mp4');
  const [splitVideoError, segmentedVideosPath] = await tryToCatch(
    splitVideo, { input: filePath, customPath: path.resolve(rootPath, 'segment') },
  );
  if (splitVideoError) {
    await promisify(rimraf)(rootPath);
    console.warn('split-video-error');
    throw splitVideoError;
  }

  const [convertVideoError, convertedVideosPath] = await tryToCatch(
    async (inputPath: string) => {
      const files = await readdir(inputPath);

      let bitratePath = path.resolve(rootConvertedVideosPath, '360');
      let [error] = await tryToCatch(fs.stat, bitratePath);
      if (error) { await fs.mkdir(bitratePath); }
      bitratePath = path.resolve(rootConvertedVideosPath, '480');
      [error] = await tryToCatch(fs.stat, bitratePath);
      if (error) { await fs.mkdir(bitratePath); }
      bitratePath = path.resolve(rootConvertedVideosPath, '720');
      [error] = await tryToCatch(fs.stat, bitratePath);
      if (error) { await fs.mkdir(bitratePath); }

      await Bluebird.map(files, async (fileName) => {
        const temp = path.resolve(inputPath, fileName);
        await Promise.all(
          [
            convertVideo({
              input: temp,
              output: rootConvertedVideosPath,
              bitrate: '360',
            }),
            convertVideo({
              input: temp,
              output: rootConvertedVideosPath,
              bitrate: '480',
            }),
            convertVideo({
              input: temp,
              output: rootConvertedVideosPath,
              bitrate: '720',
            }),
          ],
        );
      }, { concurrency: 100 });
      return rootConvertedVideosPath;
    }, segmentedVideosPath as string,
  );
  await promisify(rimraf)(segmentedVideosPath as string);
  if (convertVideoError) {
    console.warn('convert-video-error');
    throw convertVideoError;
  }

  const [mergeVideosError, mergedVideosResult] = await tryToCatch(mergeVideos, {
    input: convertedVideosPath as string,
    customPath: path.resolve(rootPath, 'merge'),
  });
  await promisify(rimraf)(convertedVideosPath as string);
  if (mergeVideosError) {
    console.warn('merge-video-error');
    throw mergeVideosError;
  }

  assert(mergedVideosResult);

  const outputDir = await packageVideos({
    input: mergedVideosResult.videos as string[],
    output: outputPath,
  });
  await promisify(rimraf)(mergedVideosResult.path as string);

  console.log(outputDir);
  console.timeEnd('process');
  await promisify(rimraf)(outputDir as string);
})();
