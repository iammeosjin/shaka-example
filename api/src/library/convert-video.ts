/* eslint-disable no-console */
import path from 'path';
import { binPath, convertedVideosPath, execFile } from './constants';

export default async function convertVideo(params: {
  input: string,
  output?: string,
  bitrate?: '360' | '480' | '720' | '1080'
}) {
  const { input, output, bitrate } = params;
  const name = path.basename(input);
  const bitratePath = path.resolve(output || convertedVideosPath, bitrate || '360');

  const outputPath = path.resolve(bitratePath, name);
  let settings = {
    scale: '360',
    profile: 'baseline',
    level: '3.0',
    size: '600k',
  };

  if (bitrate === '480') {
    settings = {
      scale: '480',
      profile: 'main',
      level: '3.1',
      size: '1000k',
    };
  } else if (bitrate === '720') {
    settings = {
      scale: '720',
      profile: 'main',
      level: '4.0',
      size: '3000k',
    };
  } else if (bitrate === '1080') {
    settings = {
      scale: '1080',
      profile: 'high',
      level: '4.2',
      size: '6000k',
    };
  }

  console.time(`convert-video-${name}-${bitrate}`);
  await execFile(
    path.resolve(binPath, './ffmpeg'),
    [
      '-i',
      input,
      '-c:a',
      'copy',
      '-c:v',
      'libx264',
      '-profile:v',
      settings.profile,
      '-level:v',
      settings.level,
      '-x264-params',
      'scenecut=0:open_gop=0:min-keyint=72:keyint=72',
      '-vf',
      `scale=-2:${settings.scale}`,
      '-minrate',
      settings.size,
      '-maxrate',
      settings.size,
      '-bufsize',
      settings.size,
      '-b:v',
      settings.size,
      '-y',
      outputPath,
    ],
  );
  console.timeEnd(`convert-video-${name}-${bitrate}`);
  return output || outputPath;
}
/*
[
      '-i',
      input,
      '-vf',
      'scale=-2:360,format=yuv420p',
      '-c:v',
      'libx264',
      '-crf',
      '23',
      '-preset',
      'medium',
      '-c:a',
      'aac',
      '-b:a',
      '128k',
      '-movflags',
      '+faststart',
      '-y',
      output,
    ]
*/
