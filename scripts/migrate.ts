import { readdir, readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { PostgresDatabase } from '../src/infrastructure/persistence/postgres/PostgresDatabase.js';

const database = new PostgresDatabase();

try {
  await database.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `);

  const directory = new URL('../db/migrations/', import.meta.url);
  const files = (await readdir(directory)).filter((file) => file.endsWith('.sql')).sort();
  const applied = await database.query<{ version: string }>('SELECT version FROM schema_migrations');
  const appliedVersions = new Set(applied.rows.map((row) => row.version));

  for (const file of files) {
    if (appliedVersions.has(file)) continue;
    const sql = await readFile(join(directory.pathname, file), 'utf8');
    await database.transaction(async (client) => {
      await client.query(sql);
      await client.query('INSERT INTO schema_migrations(version) VALUES ($1)', [file]);
    });
    console.log(`Applied migration ${file}`);
  }
} finally {
  await database.close();
}
