import { Context } from '../../types';

export default {
  Query: {
    async files(_:never, __:never, ctx: Context) {
      return ctx.models.file.find({});
    },
  },
};
