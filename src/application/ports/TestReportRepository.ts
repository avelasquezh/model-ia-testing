import type { TestReport } from '../../domain/report/TestReport.js';

export interface TestReportRepository {
  save(report: TestReport): Promise<void>;
  findById(id: string): Promise<TestReport | undefined>;
}
