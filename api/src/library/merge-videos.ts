/* eslint-disable no-console */
import path from 'path';
import Bluebird from 'bluebird';
import R from 'ramda';
import fs, { writeFile } from 'fs/promises';
import tryToCatch from 'try-to-catch';
import {
  binPath,
  execFile,
  mergedVideosPath,
  readdir,
  rootPath,
} from './constants';

export default async function mergeVideos(params: {
  input: string,
  customPath?: string
}) {
  const outputPath = params.customPath || mergedVideosPath;
  const [error] = await tryToCatch(fs.stat, outputPath);
  if (error) { await fs.mkdir(outputPath); }
  console.time('concat-video');
  const files = await readdir(params.input);
  const contents: Record<string, string> = {};
  await Bluebird.map(files, async (file) => {
    const name = path.basename(params.input);
    const subPath = path.resolve(params.input, file);
    const stat = await fs.stat(subPath);
    if (stat.isDirectory()) {
      const subFiles = await readdir(subPath);
      contents[file] = subFiles.map((subFile) => `file '${path.resolve(subPath, subFile)}'`).join('\n');
    } else {
      contents[name] += `file '${subPath}'\n`;
    }
  }, { concurrency: 1 });

  const result = await Bluebird.map(
    R.toPairs(contents),
    async ([key, content]) => {
      const output = path.resolve(outputPath, `${key}.mp4`);
      const txt = path.resolve(rootPath, `${key}.txt`);
      await writeFile(txt, content, 'utf-8');
      await execFile(
        path.resolve(binPath, './ffmpeg'),
        [
          '-safe',
          '0',
          '-f',
          'concat',
          '-i',
          txt,
          '-c',
          'copy',
          '-fflags',
          '+genpts',
          output,
        ],
      );
      return output;
    },
    { concurrency: 10 },
  );
  console.timeEnd('concat-video');
  return {
    path: outputPath,
    videos: result,
  };
}
