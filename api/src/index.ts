/* eslint-disable no-console */
import cors from '@koa/cors';
import { graphqlUploadKoa } from 'graphql-upload';
import { ApolloServer } from 'apollo-server-koa';
import { makeExecutableSchema } from '@graphql-tools/schema';
import { mergeResolvers, mergeTypeDefs } from '@graphql-tools/merge';
import { loadFilesSync } from '@graphql-tools/load-files';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import path from 'path';
import R from 'ramda';
import { createServer, Server } from 'http';

let apollo: ApolloServer;
let server: Server;

async function start() {
  const app = new Koa();
  app.use(
    bodyParser({
      jsonLimit: '2mb',
    }),
  );

  app.use(
    cors({
      origin: '*',
      maxAge: 3600,
    }),
  );

  app.use(graphqlUploadKoa({
    maxFileSize: 1e9,
  }));

  const files = loadFilesSync(path.join(__dirname, './type-defs'), {
    recursive: true,
  });

  const typeDefs = mergeTypeDefs(files);

  const resolvers = mergeResolvers(loadFilesSync(path.join(__dirname, './resolvers'), {
    recursive: true,
  }) as never);

  const schema = makeExecutableSchema({
    typeDefs,
    resolvers,
  });

  apollo = new ApolloServer({
    schema,
    context: ({ ctx, connection }) => Object.assign(ctx || {}, R.prop('context')(connection) || {}),
    debug: true,
    introspection: true,
  });

  await apollo.start();

  apollo.applyMiddleware({ app });

  server = createServer(app.callback());
  server.listen('8001');
  console.log('started');
}

async function stop() {
  if (apollo) {
    apollo.stop();
  }

  if (server) {
    server.close();
  }
}

start().catch((error) => {
  console.warn(error);
  stop();
});
