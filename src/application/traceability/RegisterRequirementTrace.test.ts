import { describe, expect, it } from 'vitest';
import { RequirementTrace } from '../../domain/traceability/RequirementTrace.js';
import type { RequirementTraceRepository } from '../ports/RequirementTraceRepository.js';
import { RegisterRequirementTrace } from './RegisterRequirementTrace.js';

class TestRequirementTraceRepository implements RequirementTraceRepository {
  public saved?: RequirementTrace;

  public async save(trace: RequirementTrace): Promise<void> {
    this.saved = trace;
  }

  public async findByRequirementId(requirementId: string): Promise<RequirementTrace | undefined> {
    return this.saved?.props.requirementId === requirementId ? this.saved : undefined;
  }
}

describe('RegisterRequirementTrace', () => {
  it('registers a covered requirement with the complete trace chain', async () => {
    const repository = new TestRequirementTraceRepository();
    const useCase = new RegisterRequirementTrace(repository);

    const trace = await useCase.execute({
      requirementId: 'REQ-F1-040',
      scenarioIds: ['scenario-1'],
      executionIds: ['execution-1'],
      resultIds: ['result-1'],
      findingIds: ['finding-1'],
      reportIds: ['report-1'],
    });

    expect(trace.props.coverageStatus).toBe('COVERED');
    expect(trace.props.scenarioIds).toEqual(['scenario-1']);
    expect(trace.props.executionIds).toEqual(['execution-1']);
    expect(trace.props.resultIds).toEqual(['result-1']);
    expect(trace.props.findingIds).toEqual(['finding-1']);
    expect(trace.props.reportIds).toEqual(['report-1']);
    expect(repository.saved).toBe(trace);
  });

  it('makes absence of scenarios explicit as uncovered', async () => {
    const trace = await new RegisterRequirementTrace(
      new TestRequirementTraceRepository(),
    ).execute({ requirementId: 'REQ-F1-072' });

    expect(trace.props.coverageStatus).toBe('UNCOVERED');
    expect(trace.props.scenarioIds).toEqual([]);
  });

  it('rejects duplicate trace identifiers', async () => {
    await expect(
      new RegisterRequirementTrace(new TestRequirementTraceRepository()).execute({
        requirementId: 'REQ-F1-067',
        scenarioIds: ['scenario-1', 'scenario-1'],
      }),
    ).rejects.toThrow('cannot contain duplicate ids');
  });

  it('rejects blank requirement identifiers', async () => {
    await expect(
      new RegisterRequirementTrace(new TestRequirementTraceRepository()).execute({
        requirementId: ' ',
      }),
    ).rejects.toThrow('Requirement id is required');
  });
});
