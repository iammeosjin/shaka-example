import { createWriteStream, ReadStream } from 'fs';
import rimraf from 'rimraf';
import { promisify } from 'util';
import path from 'path';

export async function writeFile(
  args: {
    stream: ReadStream,
    filePath: string,
    fileName: string,
  },
) {
  const { stream } = args;
  const url = path.resolve(args.filePath, args.fileName);
  await new Promise((resolve, reject) => {
    const file = createWriteStream(url);

    stream.pipe(file);
    stream.on('error', async (error: Error) => {
      file.close();
      file.emit('error', error);
    });

    file.on('error', reject);
    file.on('finish', resolve);
  }).catch(async (error) => {
    await promisify(rimraf)(args.filePath);
    throw error;
  });

  return url;
}
