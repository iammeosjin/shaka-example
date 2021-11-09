import { gql } from 'apollo-server-koa';

export default gql`
enum FileStatus {
  PROCESSING
  READY
  FAILED
}

type File implements Node {
  id: ID!
  fileName: String!
  mimetype: String!
  encoding: String!
  status: FileStatus!
  url: String!
}

type UploadFileResponse {
  file: File!
}

type UpdateFileResponse {
  file: File!
}

input UploadFileInput {
  file: Upload!
}

input UpdateFileInput {
  status: FileStatus!
}

type Query {
  files: [File!]!
}

type Mutation {
  uploadFile(input: UploadFileInput!): UploadFileResponse!
  deleteFile(id: ID!): Boolean!
  updateFile(id: ID!, input: UpdateFileInput!): UpdateFileResponse!
}
`;
