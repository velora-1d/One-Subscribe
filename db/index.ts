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

// Disable prefetch for safe connection pooling (especially with services like Supabase/Neon/Self-hosted)
export const client = postgres(connectionString, {
  prepare: false,
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export const db = drizzle(client, { schema });
