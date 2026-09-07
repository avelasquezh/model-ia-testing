import type { TestFindingRepository } from '../../application/ports/TestFindingRepository.js';
import type { TestFinding } from '../../domain/finding/TestFinding.js';

export class InMemoryTestFindingRepository implements TestFindingRepository {
  private readonly findings = new Map<string, TestFinding>();

  public async save(finding: TestFinding): Promise<void> {
    this.findings.set(finding.props.id, finding);
  }

  public async findById(id: string): Promise<TestFinding | undefined> {
    return this.findings.get(id);
  }

  public async findByExecutionId(executionId: string): Promise<readonly TestFinding[]> {
    return [...this.findings.values()].filter(
      (finding) => finding.props.executionId === executionId,
    );
  }
}
