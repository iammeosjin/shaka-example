import { ParameterizedContext } from 'koa';
import DataLoader from 'dataloader';
import FileModel, { File } from './models/file';

export type Context = ParameterizedContext & {
  models: {
    file: typeof FileModel
  },
  config: {
    bucket: string
  },
  loaders: {
    file: DataLoader<string, File>;
  }
};
