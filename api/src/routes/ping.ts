import KoaRouter from '@koa/router';
import { Context } from '../types';
import io from '../library/socket-io';

export default function (router: KoaRouter) {
  router.get('/ping', async (ctx: Context) => {
    ctx.status = 200;
    io.emit('progress', JSON.stringify({
      id: 'test',
      progress: 100,
    }));
    ctx.body = 'pong';
  });
}
