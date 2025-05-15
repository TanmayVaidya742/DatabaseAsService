// utils/pool.utils.ts
import { Pool } from 'pg';

export const mainPool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.MAIN_DB_NAME || 'PYRAMID_DBAAS',
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 5432),
});

const poolCache: Record<string, Pool> = {};

export const getPoolForDatabase = (dbName: string): Pool => {
  if (!poolCache[dbName]) {
    poolCache[dbName] = new Pool({
      user: process.env.DB_USER,
      host: process.env.DB_HOST,
      database: dbName,
      password: process.env.DB_PASSWORD,
      port: Number(process.env.DB_PORT || 5432),
    });
  }
  return poolCache[dbName];
};
