import type { ExecutionSecurityPort } from '../../application/ports/ExecutionSecurityPort.js';

export class InMemoryExecutionSecurityPolicy implements ExecutionSecurityPort {
  private readonly allowedTargetIds: ReadonlySet<string>;

  public constructor(
    allowedTargetIds: readonly string[],
    private readonly maxTimeoutMs = 60_000,
  ) {
    this.allowedTargetIds = new Set(allowedTargetIds);
    if (!Number.isInteger(maxTimeoutMs) || maxTimeoutMs <= 0) {
      throw new Error('Maximum execution timeout must be a positive integer');
    }
  }

  public async authorizeTarget(targetId: string): Promise<boolean> {
    return this.allowedTargetIds.has(targetId);
  }

  public validateTimeout(timeoutMs: number): void {
    if (!Number.isInteger(timeoutMs) || timeoutMs <= 0) {
      throw new Error('Execution timeout must be a positive integer');
    }
    if (timeoutMs > this.maxTimeoutMs) {
      throw new Error('Execution timeout exceeds configured maximum');
    }
  }
}
