import { gql } from 'apollo-server-koa';

export default gql`
interface Node {
  id: ID!
}

type Query {
  node(id: ID!): Node
}
`;
