import KoaRouter from '@koa/router';
import fs from 'fs';
import mime from 'mime-types';
import { Context } from '../types';

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

  router.get('/file/:id', async (ctx: Context) => {
    ctx.status = 200;
    ctx.set('Cache-Control', 'no-store');
    ctx.set('Pragma', 'no-cache');
    const file = await ctx.models.file.findById(ctx.params.id);
    if (!file) {
      ctx.status = 400;
      return;
    }
    const mimeType = mime.lookup(file.url);
    const src = fs.createReadStream(file.url);
    ctx.response.set('content-type', mimeType as string);
    ctx.body = src;
  });
}
