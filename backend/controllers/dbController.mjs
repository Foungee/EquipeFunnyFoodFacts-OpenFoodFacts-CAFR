import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const pool = new pg.Pool({
  host: 'pg.us-east-1-aws.motherduck.com',
  port: 5432,
  user: 'postgres',
  password: process.env.MOTHERDUCK_TOKEN,
  ssl: { rejectUnauthorized: true },
  database: 'my_db',
  max: 10,
  idleTimeoutMillis: 5000,
});

export async function query(sql, params = []) {
  const c = await pool.connect();
  try {
    return (await c.query(sql, params)).rows;
  } finally {
    c.release();
  }
}

export default query;
