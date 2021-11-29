export type File = Partial<{
  id: string;
  fileName: string;
  encoding: string;
  mimetype: string;
  status: string;
  url: string;
  progress?: number;
}>;

export type AllFiles = {
  files: File[]
}