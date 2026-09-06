import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import type { ExecutionEvidenceEvent } from '../../application/ports/ExecutionEvidencePublisher.js';
import { LiveExecutionEvidencePublisher } from './LiveExecutionEvidencePublisher.js';

describe('LiveExecutionEvidencePublisher', () => {
  it('writes each screenshot as soon as the evidence event is published', async () => {
    const rootDirectory = await mkdtemp(join(tmpdir(), 'model-ia-testing-evidence-'));

    try {
      const publisher = new LiveExecutionEvidencePublisher(rootDirectory);
      const screenshot = new Uint8Array([1, 2, 3, 4]);
      const event: ExecutionEvidenceEvent = {
        type: 'OBSERVATION',
        executionId: 'execution-1',
        turnIndex: 0,
        observation: {
          input: 'Hola',
          response: 'Respuesta',
          startedAt: new Date('2026-09-06T12:00:00Z'),
          observedAt: new Date('2026-09-06T12:00:01Z'),
          durationMs: 1_000,
          screenshot,
        },
      };

      await publisher.publish(event);

      const screenshotPath = join(rootDirectory, 'execution-1', 'turn-01.png');
      const metadataPath = join(rootDirectory, 'execution-1', 'turn-01.json');
      expect(new Uint8Array(await readFile(screenshotPath))).toEqual(screenshot);
      expect(await readFile(metadataPath, 'utf8')).toContain('captured');
    } finally {
      await rm(rootDirectory, { recursive: true, force: true });
    }
  });
});
