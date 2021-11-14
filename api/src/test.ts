/* eslint-disable no-console */
import path from 'path';
import Bluebird from 'bluebird';
import splitVideo from './library/split-video';
import { convertedVideosPath, readdir, rootPath } from './library/constants';
import convertVideo from './library/convert-video';
import mergeVideos from './library/merge-videos';
import packageVideos from './library/package-videos';

(async () => {
  console.time('process');
  const inputFile = 'valid.mp4';
  let resultPath: string;

  const test = parseInt(process.env.TEST || '0', 10);
  if (test) {
    resultPath = await splitVideo({
      input: path.resolve(rootPath, inputFile),
    });
    console.time('convert-segment-videos');
    const files = await readdir(resultPath);
    await Bluebird.map(files, async (file) => {
      await Promise.all(
        [
          convertVideo({
            input: path.resolve(resultPath, file),
            output: convertedVideosPath,
            bitrate: '360',
          }),
          convertVideo({
            input: path.resolve(resultPath, file),
            output: convertedVideosPath,
            bitrate: '480',
          }),
          convertVideo({
            input: path.resolve(resultPath, file),
            output: convertedVideosPath,
            bitrate: '720',
          }),
        ],
      );
    }, { concurrency: 10 });
    console.timeEnd('convert-segment-videos');
  } else {
    resultPath = await convertVideo({
      input: path.resolve(rootPath, inputFile),
    });
  }
  console.log(convertedVideosPath, path.basename(convertedVideosPath));
  const { videos } = await mergeVideos({ input: convertedVideosPath });
  await packageVideos({ input: videos });
  console.timeEnd('process');
})();
