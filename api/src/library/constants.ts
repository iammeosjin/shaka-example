import childProcess from 'child_process';
import path from 'path';
import { promisify } from 'util';
import fs from 'fs';

export const binPath = process.env.BIN_PATH || path.resolve(__dirname, '../bin');
export const rootPath = path.resolve(__dirname, '../../tmp');

export const segmentsPath = path.resolve(rootPath, 'segments');
export const convertedVideosPath = path.resolve(rootPath, 'converted-videos');
export const mergedVideosPath = path.resolve(rootPath, 'merged-videos');
export const outputPath = path.resolve(rootPath, 'output');

export const execFile = promisify(childProcess.execFile);
export const readdir = promisify(fs.readdir);
export const writeFile = promisify(fs.writeFile);
