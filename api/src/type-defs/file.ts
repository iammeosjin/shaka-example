import { gql } from 'apollo-server-koa';

export default gql`
enum FileStatus {
  PROCESSING
  READY
  FAILED
}

type File {
  id: ID!
  mimetype: String!
  encoding: String!
  status: FileStatus!
}

type UploadFileResponse {
  file: File!
}

input UploadFileInput {
  file: Upload!
}

type Query {
  files: [File!]!
}

type Mutation {
  uploadFile: Boolean!
}
`;
