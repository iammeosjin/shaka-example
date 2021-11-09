import Router from '@koa/router';
import fileRoute from './file';

const router = new Router();

[fileRoute].forEach((route) => route(router));

export default router;
