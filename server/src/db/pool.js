import "dotenv/config";
import pg from "pg";

const { Pool } = pg;

export const pool = new Pool({
  connectionString:
    process.env.DATABASE_URL || "postgres://postgres:123@localhost:5432/quizzer"
});

export function query(sql, params) {
  return pool.query(sql, params);
}
