import { Context } from '../../types';

export default {
  Query: {
    node(_:never, args: { id: string }, ctx: Context) {
      return ctx.loaders.file.load(args.id);
    },
  },
};
