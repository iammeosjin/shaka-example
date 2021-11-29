import fs from 'fs/promises';

export default async function createFolder(folder: string) {
  try {
    await fs.access(folder);
  } catch {
    await fs.mkdir(folder);
  }
}
