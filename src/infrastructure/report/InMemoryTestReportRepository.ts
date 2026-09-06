import type { TestReportRepository } from '../../application/ports/TestReportRepository.js';
import type { TestReport } from '../../domain/report/TestReport.js';

export class InMemoryTestReportRepository implements TestReportRepository {
  private readonly reports = new Map<string, TestReport>();

  public async save(report: TestReport): Promise<void> {
    this.reports.set(report.props.id, report);
  }

  public async findById(id: string): Promise<TestReport | undefined> {
    return this.reports.get(id);
  }
}
