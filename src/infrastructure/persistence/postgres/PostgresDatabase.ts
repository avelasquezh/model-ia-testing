import { Pool, type PoolClient, type QueryResultRow } from 'pg';

export type PostgresDatabaseOptions = {
  readonly connectionString?: string;
  readonly max?: number;
};

export class PostgresDatabase {
  private readonly pool: Pool;

  public constructor(options: PostgresDatabaseOptions = {}) {
    this.pool = new Pool({
      connectionString: options.connectionString ?? process.env.DATABASE_URL,
      max: options.max,
    });
  }

  public query<T extends QueryResultRow = QueryResultRow>(text: string, values: readonly unknown[] = []) {
    return this.pool.query<T>(text, values as unknown[]);
  }

  public async transaction<T>(work: (client: PoolClient) => Promise<T>): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await work(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  public async close(): Promise<void> {
    await this.pool.end();
  }
}
