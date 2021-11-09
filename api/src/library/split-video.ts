/* eslint-disable no-console */
import path from 'path';
import { binPath, execFile, segmentsPath } from './constants';

export default async function splitVideo(input: string) {
  console.time('segment-video');
  await execFile(
    path.resolve(binPath, './ffmpeg'),
    [
      '-i',
      input,
      '-c',
      'copy',
      '-f',
      'segment',
      '-segment_time',
      '60',
      '-g',
      '60',
      path.resolve(segmentsPath, '%03d.mp4'),
    ],
  );
  console.timeEnd('segment-video');
  return segmentsPath;
}
