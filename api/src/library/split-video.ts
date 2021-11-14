/* eslint-disable no-console */
import path from 'path';
import { binPath, execFile, segmentsPath } from './constants';
import createFolder from './create-folder';

export default async function splitVideo(args: {
  input: string, id?: string, size?: number
}) {
  const { input, id, size } = args;
  const limit = size || 60;
  const outputPath = id ? path.resolve(segmentsPath, id) : segmentsPath;
  await createFolder(outputPath);
  const tag = `segment-video-${id || '1'}`;
  console.time(tag);
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
      limit.toString(),
      '-g',
      '60',
      path.resolve(outputPath, '%03d.mp4'),
    ],
  );
  console.timeEnd(tag);
  return outputPath;
}
