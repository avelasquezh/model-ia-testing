import { describe, expect, it } from 'vitest';
import { PostgresDatabase } from '../../src/infrastructure/persistence/postgres/PostgresDatabase.js';

describe('PostgreSQL persistence spike', () => {
  it('connects to PostgreSQL and exposes transactional boundaries', async () => {
    const database = new PostgresDatabase();
    try {
      const result = await database.query<{ value: number }>('SELECT 1 AS value');
      expect(result.rows[0]?.value).toBe(1);

      const committed = await database.transaction(async (client) => {
        await client.query('CREATE TEMP TABLE persistence_spike (id INTEGER PRIMARY KEY)');
        await client.query('INSERT INTO persistence_spike(id) VALUES (1)');
        return client.query<{ count: string }>('SELECT COUNT(*)::text AS count FROM persistence_spike');
      });
      expect(committed.rows[0]?.count).toBe('1');

      await expect(database.transaction(async (client) => {
        await client.query('CREATE TEMP TABLE rollback_spike (id INTEGER PRIMARY KEY)');
        await client.query('INSERT INTO rollback_spike(id) VALUES (1)');
        throw new Error('forced rollback');
      })).rejects.toThrow('forced rollback');
    } finally {
      await database.close();
    }
  });
});
