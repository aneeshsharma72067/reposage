import { Pool } from 'pg';
import { env, isProduction } from '../config/env';

export const pool = new Pool({
  connectionString: env.DATABASE_URL,
  ssl: isProduction ? { rejectUnauthorized: false } : false,
  max: 20,
  connectionTimeoutMillis: 5000,
  idleTimeoutMillis: 30000,
});

pool.on('error', (error: Error) => {
  console.error('Unexpected PostgreSQL pool error', error);
});

