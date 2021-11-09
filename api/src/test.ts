/* eslint-disable no-console */
import path from 'path';
import Bluebird from 'bluebird';
import splitVideo from './library/split-video';
import { convertedVideosPath, readdir, rootPath } from './library/constants';
import convertVideo from './library/convert-video';
import mergeVideos from './library/merge-videos';
import packageVideo from './library/package-video';

(async () => {
  console.time('process');
  const inputFile = 'test.mp4';
  let resultPath: string;

  const test = parseInt(process.env.TEST || '0', 10);
  console.log(test);
  if (test) {
    resultPath = await splitVideo(path.resolve(rootPath, inputFile));
    console.time('convert-segment-videos');
    const files = await readdir(resultPath);
    await Bluebird.map(files, async (file) => {
      await convertVideo(path.resolve(resultPath, file), convertedVideosPath);
    }, { concurrency: 10 });
    console.timeEnd('convert-segment-videos');
  } else {
    console.log('test');
    resultPath = await convertVideo(path.resolve(rootPath, inputFile));
  }

  resultPath = await mergeVideos(convertedVideosPath);
  await packageVideo(resultPath);
  console.timeEnd('process');
})();
