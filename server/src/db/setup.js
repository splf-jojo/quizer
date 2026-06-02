import "dotenv/config";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const databaseUrl =
  process.env.DATABASE_URL || "postgres://postgres:123@localhost:5432/quizzer";
const currentDir = dirname(fileURLToPath(import.meta.url));

function quoteIdentifier(value) {
  return `"${value.replace(/"/g, '""')}"`;
}

async function ensureDatabase() {
  const targetUrl = new URL(databaseUrl);
  const databaseName = targetUrl.pathname.replace(/^\//, "");

  if (!databaseName) {
    throw new Error("DATABASE_URL must include a database name");
  }

  const maintenanceUrl = new URL(databaseUrl);
  maintenanceUrl.pathname = "/postgres";

  const pool = new Pool({ connectionString: maintenanceUrl.toString() });

  try {
    const { rows } = await pool.query("SELECT 1 FROM pg_database WHERE datname = $1", [
      databaseName
    ]);

    if (!rows[0]) {
      await pool.query(`CREATE DATABASE ${quoteIdentifier(databaseName)}`);
      console.log(`Created database ${databaseName}`);
    }
  } finally {
    await pool.end();
  }
}

async function runSqlFiles() {
  const pool = new Pool({ connectionString: databaseUrl });

  try {
    for (const fileName of ["init.sql", "seed.sql"]) {
      const sql = await readFile(join(currentDir, fileName), "utf8");
      await pool.query(sql);
      console.log(`Applied ${fileName}`);
    }
  } finally {
    await pool.end();
  }
}

try {
  await ensureDatabase();
  await runSqlFiles();
  console.log("Database setup complete");
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}
