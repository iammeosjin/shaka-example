import Router from '@koa/router';
import fileRoute from './file';
import pingRoute from './ping';

const router = new Router();

[pingRoute, fileRoute].forEach((route) => route(router));

export default router;
