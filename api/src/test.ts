/* eslint-disable no-console */
import childProcess from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';
import Bluebird from 'bluebird';

const execFile = promisify(childProcess.execFile);

(async () => {
  const binPath = path.resolve(__dirname, './bin');
  const rootPath = path.resolve(__dirname, '../tmp');
  const convertedPath = path.resolve(rootPath, 'converted');
  const segmentsPath = path.resolve(rootPath, 'segments');
  const inputPath = path.resolve(rootPath, 'input');
  const outputPath = path.resolve(rootPath, 'output');
  const audioPath = path.resolve(outputPath, 'audio');
  const videoPath = path.resolve(outputPath, 'video');
  const inputFile = 'test.mp4';

  async function packageVideo(input: string) {
    try {
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
    } catch (error) {
      console.warn('error', error);
    }
  }

  async function convertVideo(input: string) {
    try {
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
    } catch (error) {
      console.warn('error', error);
      throw error;
    }
  }

  async function splitVideo(input: string) {
    try {
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
          '10',
          '-g',
          '10',
          path.resolve(segmentsPath, '%03d.mp4'),
        ],
      );
      console.timeEnd('segment-video');
    } catch (error) {
      console.warn('error', error);
    }
  }

  async function concatVideos() {
    console.time('concat-video');
    const output = path.resolve(inputPath, 'input.mp4');
    console.log(output);
    const files = await promisify(fs.readdir)(convertedPath);
    const content = files.map((file) => `file 'converted\\${file}'`).join('\n');
    await promisify(fs.writeFile)(`${rootPath}/segment.txt`, content, 'utf-8');

    try {
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
    } catch (error) {
      console.warn('error', error);
    }
    console.timeEnd('concat-video');
    return output;
  }

  console.time('process');
  await splitVideo(path.resolve(rootPath, inputFile));
  console.time('convert-segment-videos');
  const files = await promisify(fs.readdir)(segmentsPath);
  await Bluebird.map(files, async (file) => {
    await convertVideo(path.resolve(segmentsPath, file));
  }, { concurrency: 5 });
  console.timeEnd('convert-segment-videos');
  const input = await concatVideos();
  /*
  const input = await convertVideo(path.resolve(rootPath, inputFile));

  */
  await packageVideo(input);
  console.timeEnd('process');
})();
