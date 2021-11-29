/* eslint-disable no-console */
import path from 'path';
import { binPath, execFile, outputPath as outputPathDep } from './constants';

export default async function packageVideo(input: string, output?: string) {
  const outputPath = output || outputPathDep;
  const audioPath = path.resolve(outputPath, 'audio');
  const videoPath = path.resolve(outputPath, 'video');

  console.time('shaka-packager');
  await execFile(
    path.resolve(binPath, './packager-win'),
    [
      `in=${
        input
      },stream=audio,init_segment=${audioPath}/init.mp4,segment_template=${audioPath}/$Number$.m4s`,
      `in=${
        input
      },stream=video,init_segment=${videoPath}/init.mp4,segment_template=${videoPath}/$Number$.m4s`,
      '--generate_static_live_mpd',
      '--mpd_output',
      `${outputPath}/play.mpd`,
      '--hls_master_playlist_output',
      `${outputPath}/play.m3u8`,
    ],
  );
  console.timeEnd('shaka-packager');
  return outputPath;
}
