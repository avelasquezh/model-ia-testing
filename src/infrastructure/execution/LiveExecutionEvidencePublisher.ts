import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import type {
  ExecutionEvidenceEvent,
  ExecutionEvidencePublisher,
} from '../../application/ports/ExecutionEvidencePublisher.js';

export class LiveExecutionEvidencePublisher implements ExecutionEvidencePublisher {
  public constructor(private readonly rootDirectory: string) {}

  public async publish(event: ExecutionEvidenceEvent): Promise<void> {
    const executionDirectory = join(this.rootDirectory, event.executionId);
    await mkdir(executionDirectory, { recursive: true });

    if (event.type === 'OBSERVATION') {
      const turn = String(event.turnIndex + 1).padStart(2, '0');
      const screenshotPath = join(executionDirectory, `turn-${turn}.png`);
      const metadataPath = join(executionDirectory, `turn-${turn}.json`);

      if (event.observation.screenshot !== undefined) {
        await writeFile(screenshotPath, event.observation.screenshot);
      }

      await writeFile(
        metadataPath,
        JSON.stringify(
          {
            type: event.type,
            executionId: event.executionId,
            turnIndex: event.turnIndex,
            input: event.observation.input,
            response: event.observation.response,
            startedAt: event.observation.startedAt.toISOString(),
            observedAt: event.observation.observedAt.toISOString(),
            durationMs: event.observation.durationMs,
            hasScreenshot: event.observation.screenshot !== undefined,
          },
          null,
          2,
        ),
      );

      return;
    }

    await writeFile(
      join(executionDirectory, `error-${event.error.occurredAt.getTime()}.json`),
      JSON.stringify(
        {
          type: event.type,
          executionId: event.executionId,
          code: event.error.code,
          message: event.error.message,
          operation: event.error.operation,
          turnIndex: event.error.turnIndex,
          occurredAt: event.error.occurredAt.toISOString(),
        },
        null,
        2,
      ),
    );
  }
}
