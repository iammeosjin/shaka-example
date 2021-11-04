/* eslint-disable no-console */
import path from 'path';
import { binPath, convertedPath, execFile } from './constants';

export default async function convertVideo(input: string) {
  const name = path.basename(input);
  const output = path.resolve(convertedPath, name);
  console.time(`convert-video-${name}`);
  await execFile(
    path.resolve(binPath, './ffmpeg'),
    [
      '-i',
      input,
      '-c:a',
      'copy',
      '-vf',
      'scale=-2:360',
      '-c:v',
      'libx264',
      '-profile:v',
      'baseline',
      '-level:v',
      '3.0',
      '-x264-params',
      'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
      '-minrate',
      '600k',
      '-maxrate',
      '600k',
      '-bufsize',
      '600k',
      '-b:v',
      '600k',
      '-y',
      output,
    ],
  );
  console.timeEnd(`convert-video-${name}`);
  return output;
}
