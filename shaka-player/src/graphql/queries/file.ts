import { gql } from '@apollo/client';

export const ALL_FILES = gql `
  query Files {
    files {
      id
      ...on File {
        fileName
        encoding
        mimetype
        status
        url
      }
    }
  }
`;