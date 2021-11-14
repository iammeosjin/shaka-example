/* eslint-disable no-console */
import path from 'path';
import { binPath, execFile, outputPath as outputPathDep } from './constants';

export default async function packageVideo(params: {
  input: string[],
  output?: string
}) {
  const outputPath = params.output || outputPathDep;
  const audioPath = path.resolve(outputPath, 'audio');
  const videoPath = path.resolve(outputPath, 'video');

  const videos = params.input.map(
    (video) => {
      const baseName = path.basename(video).split('.')[0];
      const basePath = path.resolve(videoPath, baseName);
      return `in=${
        video
      },stream=video,init_segment=${basePath}/init.mp4,segment_template=${basePath}/$Number$.m4s`;
    },
  );
  console.time('shaka-packager');
  await execFile(
    path.resolve(binPath, './packager-win'),
    [
      `in=${
        params.input[0]
      },stream=audio,init_segment=${audioPath}/init.mp4,segment_template=${audioPath}/$Number$.m4s`,
      ...videos,
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
