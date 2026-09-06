export type Evidence = {
  readonly runId: string;
  readonly type: string;
  readonly content: string;
};

export interface EvidencePort {
  capture(evidence: Evidence): Promise<void>;
}
