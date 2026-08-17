import pg from 'pg'; import dotenv from 'dotenv'; dotenv.config();
export const hasDb = Boolean(process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('postgres:postgres'));
export const pool = hasDb ? new pg.Pool({ connectionString: process.env.DATABASE_URL, ssl: process.env.DATABASE_URL.includes('localhost') ? false : { rejectUnauthorized: false } }) : null;
export async function query(sql, values) { if (!pool) return null; return pool.query(sql, values); }
