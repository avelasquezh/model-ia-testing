import { readFile } from 'node:fs/promises';
import { describe, expect, it } from 'vitest';

const forbiddenInDomain = ['playwright', 'pg', 'node:fs', 'node:http', '@cucumber'];

describe('SPIKE-010 architectural dependency rules', () => {
  it('keeps domain independent from infrastructure frameworks', async () => {
    const source = await readFile(new URL('../domain/Scenario.ts', import.meta.url), 'utf8');
    for (const dependency of forbiddenInDomain) {
      expect(source.toLowerCase()).not.toContain(dependency);
    }
  });
});
