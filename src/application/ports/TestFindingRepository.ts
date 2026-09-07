import type { TestFinding } from '../../domain/finding/TestFinding.js';

export interface TestFindingRepository {
  save(finding: TestFinding): Promise<void>;
  findById(id: string): Promise<TestFinding | undefined>;
  findByExecutionId(executionId: string): Promise<readonly TestFinding[]>;
}
