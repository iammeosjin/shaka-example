import KoaRouter from '@koa/router';
import fs from 'fs';
import path from 'path';
import mime from 'mime-types';
import { Context } from '../types';
import { FileDocument } from '../models/file';

const fileCache: Map<string, FileDocument> = new Map();

export default function (router: KoaRouter) {
  router.get('/bucket/:fileName', async (ctx: Context) => {
    ctx.status = 200;
    ctx.set('Cache-Control', 'no-store');
    ctx.set('Pragma', 'no-cache');
    const filePath = `${ctx.config.bucket}\\${ctx.params.fileName}`;
    const mimeType = mime.lookup(filePath);
    const src = fs.createReadStream(filePath);
    ctx.response.set('content-type', mimeType as string);
    ctx.body = src;
  });

  router.get('/file/:id/:fileName', async (ctx: Context) => {
    ctx.status = 200;
    ctx.set('Cache-Control', 'no-store');
    ctx.set('Pragma', 'no-cache');
    let file = fileCache.get(ctx.params.id);
    if (!file) {
      file = await ctx.models.file.findById(ctx.params.id) as FileDocument;
      fileCache.set(ctx.params.id, file);
    }
    if (!file || !file.url) {
      ctx.status = 400;
      return;
    }
    const url = path.resolve(file.url, ctx.params.fileName);
    const mimeType = mime.lookup(url);
    const src = fs.createReadStream(url);
    ctx.response.set('content-type', mimeType as string);
    ctx.body = src;
  });

  router.get('/file/:id/video/:bitrate/:fileName', async (ctx: Context) => {
    ctx.status = 200;
    ctx.set('Cache-Control', 'no-store');
    ctx.set('Pragma', 'no-cache');
    let file = fileCache.get(ctx.params.id);
    if (!file) {
      file = await ctx.models.file.findById(ctx.params.id) as FileDocument;
      fileCache.set(ctx.params.id, file);
    }
    if (!file || !file.url) {
      ctx.status = 400;
      return;
    }

    fileCache.set(ctx.params.id, file);
    const url = path.resolve(file.url, 'video', ctx.params.bitrate, ctx.params.fileName);
    const mimeType = mime.lookup(url);
    const src = fs.createReadStream(url);
    ctx.response.set('content-type', mimeType as string);
    ctx.body = src;
  });

  router.get('/file/:id/video/:fileName', async (ctx: Context) => {
    ctx.status = 200;
    ctx.set('Cache-Control', 'no-store');
    ctx.set('Pragma', 'no-cache');
    let file = fileCache.get(ctx.params.id);
    if (!file) {
      file = await ctx.models.file.findById(ctx.params.id) as FileDocument;
      fileCache.set(ctx.params.id, file);
    }
    if (!file || !file.url) {
      ctx.status = 400;
      return;
    }

    fileCache.set(ctx.params.id, file);
    const url = path.resolve(file.url, 'video', ctx.params.fileName);
    const mimeType = mime.lookup(url);
    const src = fs.createReadStream(url);
    ctx.response.set('content-type', mimeType as string);
    ctx.body = src;
  });

  router.get('/file/:id/audio/:fileName', async (ctx: Context) => {
    ctx.status = 200;
    ctx.set('Cache-Control', 'no-store');
    ctx.set('Pragma', 'no-cache');
    let file = fileCache.get(ctx.params.id);
    if (!file) {
      file = await ctx.models.file.findById(ctx.params.id) as FileDocument;
      fileCache.set(ctx.params.id, file);
    }
    if (!file || !file.url) {
      ctx.status = 400;
      return;
    }

    const url = path.resolve(file.url, 'audio', ctx.params.fileName);
    const mimeType = mime.lookup(url);
    const src = fs.createReadStream(url);
    ctx.response.set('content-type', mimeType as string);
    ctx.body = src;
  });

  router.get('/file/:id', async (ctx: Context) => {
    ctx.status = 200;
    ctx.set('Cache-Control', 'no-store');
    ctx.set('Pragma', 'no-cache');
    let file = fileCache.get(ctx.params.id);
    if (!file) {
      file = await ctx.models.file.findById(ctx.params.id) as FileDocument;
      fileCache.set(ctx.params.id, file);
    }
    if (!file || !file.url) {
      ctx.status = 400;
      return;
    }

    const { url } = file;
    const mimeType = mime.lookup(url);
    const src = fs.createReadStream(url);
    ctx.response.set('content-type', mimeType as string);
    ctx.body = src;
  });
}
