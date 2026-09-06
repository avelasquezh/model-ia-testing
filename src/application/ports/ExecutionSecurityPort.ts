export interface ExecutionSecurityPort {
  authorizeTarget(targetId: string): Promise<boolean>;
  validateTimeout(timeoutMs: number): void;
}
