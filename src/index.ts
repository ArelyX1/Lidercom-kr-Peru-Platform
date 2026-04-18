import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { typeDefs } from './schema/typeDefs.js';
import { resolvers } from './schema/resolvers.js';
import { initDatabase } from './db/index.js';

dotenv.config();

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    await initDatabase();

    const server = new ApolloServer({
      typeDefs,
      resolvers,
    });

    await server.start();

    const app = express();
    app.use(cors({
      origin: true,
      credentials: true,
    }));
    app.use(express.json());

    app.use('/graphql', expressMiddleware(server, {
      context: async ({ req }) => ({ req }),
    }));

    app.get('/health', (req, res) => {
      res.json({ status: 'ok', timestamp: new Date().toISOString() });
    });

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 GraphQL Server running at http://0.0.0.0:${PORT}/graphql`);
      console.log(`📊 Health check at http://0.0.0.0:${PORT}/health`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
