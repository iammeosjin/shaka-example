import DataLoader from 'dataloader';
import R from 'ramda';
import { Context } from '../types';
import { File } from '../models/file';

export default function (ctx: Context) {
  return {
    file: new DataLoader<string, File>(
      async (files) => {
        const map: Record<string, File> = R.reduce((accum, item: File) => {
          if (!item.id) {
            return accum;
          }
          return {
            ...accum,
            [item.id]: item,
          };
        }, {})(
          await ctx.models.file.find({
            _id: { $in: files },
          }),
        );

        return files.map((file) => map[file]);
      },
    ),
  };
}
