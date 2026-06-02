import "dotenv/config";
import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const { Pool } = pg;

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is required");
  process.exit(1);
}

const currentDir = dirname(fileURLToPath(import.meta.url));
const pool = new Pool({ connectionString: databaseUrl });

try {
  for (const fileName of ["init.sql", "seed.sql"]) {
    const sql = await readFile(join(currentDir, fileName), "utf8");
    await pool.query(sql);
    console.log(`Applied ${fileName}`);
  }

  console.log("Database migration complete");
} catch (error) {
  console.error(error);
  process.exit(1);
} finally {
  await pool.end();
}