import pg from "pg";
import dotenv from "dotenv";
dotenv.config();

const pool = new pg.Pool({
  host: "pg.us-east-1-aws.motherduck.com",
  port: 5432,
  user: "postgres",
  password: process.env.MOTHERDUCK_TOKEN,
  ssl: { rejectUnauthorized: true },
  database: "md:",
  max: 10,
  idleTimeoutMillis: 5000,
});

export default pool;
