/**
 * Applies Drizzle SQL migrations.
 *
 * If the database was bootstrapped with `db:push` (schema exists but the
 * migrations journal is empty), we record migration 0000 as already applied
 * so only newer migrations run.
 */
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import pg from "pg";

config({ path: [".env.local", ".env"] });

const migrationsFolder = resolve(import.meta.dir, "../drizzle");

function migrationHash(filename: string): string {
  const sql = readFileSync(resolve(migrationsFolder, filename), "utf8");
  return createHash("sha256").update(sql).digest("hex");
}

async function baselinePushSchema(pool: pg.Pool): Promise<void> {
  const journal = JSON.parse(
    readFileSync(resolve(migrationsFolder, "meta/_journal.json"), "utf8"),
  ) as {
    entries: Array<{ tag: string; when: number }>;
  };

  const initial = journal.entries[0];
  if (!initial) return;

  const client = await pool.connect();
  try {
    await client.query("CREATE SCHEMA IF NOT EXISTS drizzle");
    await client.query(`
      CREATE TABLE IF NOT EXISTS drizzle.__drizzle_migrations (
        id SERIAL PRIMARY KEY,
        hash text NOT NULL,
        created_at bigint
      )
    `);

    const { rows: tableRows } = await client.query<{ exists: boolean }>(`
      SELECT EXISTS (
        SELECT 1
        FROM information_schema.tables
        WHERE table_schema = 'public' AND table_name = 'user'
      ) AS exists
    `);

    if (!tableRows[0]?.exists) return;

    const { rows: countRows } = await client.query<{ count: string }>(
      "SELECT count(*)::text AS count FROM drizzle.__drizzle_migrations",
    );

    if (Number(countRows[0]?.count ?? 0) > 0) return;

    const hash = migrationHash(`${initial.tag}.sql`);
    await client.query(
      `INSERT INTO drizzle.__drizzle_migrations (hash, created_at) VALUES ($1, $2)`,
      [hash, initial.when],
    );

    console.log(`Baselined ${initial.tag} (schema was created via db:push)`);
  } finally {
    client.release();
  }
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    console.error("DATABASE_URL is not set. Add it to .env.local or .env.");
    process.exit(1);
  }

  const pool = new pg.Pool({ connectionString: databaseUrl });
  const db = drizzle(pool);

  try {
    await baselinePushSchema(pool);
    console.log("Applying pending migrations…");
    await migrate(db, { migrationsFolder });
    console.log("Migrations complete.");
  } catch (error) {
    console.error("Migration failed:", error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

void main();
