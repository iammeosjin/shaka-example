/* eslint-disable no-underscore-dangle */
import mongoose, { Document, Schema } from 'mongoose';
import faker from 'faker';

export enum FileStatus {
  PROCESSING = 'PROCESSING',
  READY = 'READY',
  FAILED = 'FAILED'
}

export type File = {
  id: string,
  fileName: string,
  mimetype: string,
  encoding: string,
  status: FileStatus,
  url: string
};

type FileDocument = Document & File;

const schema = new Schema({
  _id: {
    type: String,
    default: () => faker.datatype.uuid().replace(/-/g, ''),
  },
  fileName: {
    type: String,
    required: true,
  },
  mimetype: {
    type: String,
    required: true,
  },
  encoding: {
    type: String,
    required: true,
  },
  url: {
    type: String,
    default: null,
  },
  status: {
    type: String,
    default: FileStatus.PROCESSING,
  },
}, { id: false, _id: false });

schema.virtual('id').get(function (this: FileDocument) {
  return this._id;
});

schema.index({ status: 1 });

export default mongoose.model<FileDocument>('File', schema);
