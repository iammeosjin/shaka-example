import fs from 'fs/promises';
import path from 'path';
import { createReadStream } from 'fs';
import Bluebird from 'bluebird';
import FormData from 'form-data';
import fetch from 'node-fetch';

async function loadFiles(params: {
  data: FormData,
  directory: string,
  subFolder: string
}) {
  const { directory, subFolder } = params;
  let { data } = params;
  const files = await fs.readdir(params.directory);
  await Bluebird.map(files, async (file) => {
    const fileDirectory = `${directory}/${file}`;

    const stat = await fs.stat(fileDirectory);

    if (stat.isFile()) {
      data.append('file', createReadStream(fileDirectory), {
        filepath: `${subFolder}/${file}`,
      });
      return;
    }
    data = await loadFiles({
      data,
      directory: fileDirectory,
      subFolder: `${subFolder}/${file}`,
    });
  });
  return data;
}

export default async function addToIPFSFromFS(directory: string, id: string): Promise<string | null> {
  const data = await loadFiles({
    data: new FormData(),
    directory,
    subFolder: id,
  });

  const response = await fetch('http://localhost:5001/api/v0/add?wrap-with-directory=false&pin=false&stream-channels=true', {
    method: 'POST',
    size: Infinity,
    headers: {
      'Content-type': `multipart/form-data; boundary=${data.getBoundary()}`, // `application/octet-stream`,
    },
    body: data,
  });
  console.log('adding files to ipfs');
  const rawResult = await response.text();
  if (response.status !== 200) {
    console.warn(rawResult);
    return null;
  }

  const result = rawResult.split('\n')
    .map((index) => {
      try {
        return JSON.parse(index);
      } catch {
        return null;
      }
    })
    .filter((index) => !!index)
    .find((index) => index?.Name === id);

  return result.Hash;
}
