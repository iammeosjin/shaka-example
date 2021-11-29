import { gql } from '@apollo/client';

export const SINGLE_UPLOAD = gql`
  mutation ($file: Upload!) {
    uploadFile(input: {file: $file}) {
      file {
        id
        fileName
        encoding
        mimetype
        status
        url
      }
    }
  } 
`;

export const DELETE_FILE = gql`
  mutation ($id: ID!) {
    deleteFile(id: $id)
  } 
`;