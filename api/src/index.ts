/* eslint-disable no-console */
import cors from '@koa/cors';
import { ApolloServerPluginLandingPageGraphQLPlayground } from 'apollo-server-core';
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
import FileModel from './models/file';
import * as mongoose from './library/mongoose';
import routes from './routes';
import loaders from './loaders';
import io from './library/socket-io';

let apollo: ApolloServer;
let server: Server;

async function start() {
  await mongoose.start();
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

  app.use(async (ctx, next) => {
    Object.assign(ctx, {
      models: {
        file: FileModel,
      },
      config: {
        bucket: process.env.BUCKET || 'D:\\Downloads\\Projects\\demo\\demo-experiment\\api\\tmp\\bucket',
      },
      loaders: loaders(ctx as never),
    });

    await next();
  });

  app.use(routes.routes());
  app.use(routes.allowedMethods());

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
    introspection: true,
    debug: true,
    plugins: [
      ApolloServerPluginLandingPageGraphQLPlayground({
        title: 'Demo',
      }),
    ],
  });

  await apollo.start();

  apollo.applyMiddleware({ app });
  const port = process.env.HTTP_PORT || '3001';
  server = createServer(app.callback());
  io.listen(server.listen(port), {
    path: '/socket',
  });
  console.log('started at', apollo.graphqlPath, '-', port);
}

async function stop() {
  if (apollo) {
    apollo.stop();
  }

  if (server) {
    server.close();
  }
  await mongoose.stop();
}

start().catch((error) => {
  console.warn(error);
  stop();
});
