import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './schema';
import dotenv from 'dotenv';

// Load environment variables in development mode
dotenv.config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set in the environment variables.');
}

// Use globalThis singleton in development to prevent Vite HMR from opening new connection pools on every file reload
const globalForDb = globalThis as unknown as {
  postgresClient: postgres.Sql | undefined;
  drizzleDb: ReturnType<typeof drizzle> | undefined;
};

export const client =
  globalForDb.postgresClient ??
  postgres(connectionString, {
    prepare: false,
    max: 5,
    idle_timeout: 10,
    connect_timeout: 10,
  });

export const db = globalForDb.drizzleDb ?? drizzle(client, { schema });

if (process.env.NODE_ENV !== 'production') {
  globalForDb.postgresClient = client;
  globalForDb.drizzleDb = db;
}
