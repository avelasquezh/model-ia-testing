import { Client } from 'pg';
import { randomUUID } from 'node:crypto';
import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const connectionString = process.env.DATABASE_URL;

describe('SPIKE-007 PostgreSQL', () => {
  it('applies the migration and persists a correlated run', async () => {
    if (!connectionString) return;

    const client = new Client({ connectionString });
    await client.connect();
    try {
      const migration = await readFile(new URL('./001_spike.sql', import.meta.url), 'utf8');
      await client.query(migration);
      const id = randomUUID();
      await client.query('INSERT INTO architecture_spike_runs (id, status) VALUES ($1, $2)', [id, 'PASS']);
      const result = await client.query('SELECT id, status FROM architecture_spike_runs WHERE id = $1', [id]);
      expect(result.rows).toEqual([{ id, status: 'PASS' }]);
    } finally {
      await client.end();
    }
  });
});
