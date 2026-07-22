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

// Disable prefetch for safe connection pooling (especially with services like Supabase/Neon)
export const client = postgres(connectionString, { prepare: false });

export const db = drizzle(client, { schema });
