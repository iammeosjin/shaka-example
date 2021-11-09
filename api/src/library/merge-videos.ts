/* eslint-disable no-console */
import path from 'path';
import {
  binPath,
  execFile,
  mergedVideosPath, readdir, rootPath, writeFile,
} from './constants';

export default async function mergeVideos(inputPath: string) {
  console.time('concat-video');
  const output = path.resolve(mergedVideosPath, 'input.mp4');
  const files = await readdir(inputPath);
  const content = files.map((file) => `file '${path.resolve(inputPath, file)}'`).join('\n');
  await writeFile(path.resolve(rootPath, 'segment.txt'), content, 'utf-8');

  await execFile(
    path.resolve(binPath, './ffmpeg'),
    [
      '-safe',
      '0',
      '-f',
      'concat',
      '-i',
      path.resolve(rootPath, 'segment.txt'),
      '-c',
      'copy',
      '-fflags',
      '+genpts',
      output,
    ],
  );
  console.timeEnd('concat-video');
  return output;
}
