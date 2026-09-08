import { readFile, writeFile } from 'node:fs/promises';

type Outcome = 'PASS' | 'FAIL' | 'PARTIAL' | 'INCONCLUSIVE' | 'NOT_EVALUABLE';

type CaseResult = {
  caseId: string;
  repetition: number;
  turn: number;
  conversationId: string;
  outcome: Outcome;
  evidenceInsufficient: boolean;
  channel?: string;
  transport?: string;
  botId?: string;
  botVersion?: string;
  executionId?: string;
};

type EvaluationRun = {
  status: 'VALIDATED_REPEATABILITY' | 'NON_REPEATABLE_OBSERVATION';
  observationSchemaVersion: string;
  observationsFile: string;
  evaluator: {
    modelId: string;
    modelVersion: string;
    promptVersion: string;
    methodVersion: string;
  };
  cases: CaseResult[];
};

const inputFile = process.env.EVALUATION_RESULT_FILE?.trim();
const outputFile = process.env.EVALUATION_REPORT_FILE?.trim() || 'artifacts/evaluation-report.html';

if (!inputFile) throw new Error('EVALUATION_RESULT_FILE is required');

const escapeHtml = (value: unknown): string => String(value ?? '')
  .replaceAll('&', '&amp;')
  .replaceAll('<', '&lt;')
  .replaceAll('>', '&gt;')
  .replaceAll('"', '&quot;')
  .replaceAll("'", '&#39;');

const parseRun = (raw: string): EvaluationRun => {
  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) throw new Error('Evaluation result must be a JSON object');
  const run = parsed as Record<string, unknown>;
  if (run.observationSchemaVersion !== 'bot-observation-0.1') throw new Error('Unsupported observation schema version');
  if (!Array.isArray(run.cases) || run.cases.length === 0) throw new Error('Evaluation result must contain cases');
  if (!run.evaluator || typeof run.evaluator !== 'object') throw new Error('Evaluation result must contain evaluator provenance');
  return parsed as EvaluationRun;
};

const run = parseRun(await readFile(inputFile, 'utf8'));
const counts = new Map<Outcome, number>();
for (const result of run.cases) counts.set(result.outcome, (counts.get(result.outcome) || 0) + 1);
const cases = [...new Set(run.cases.map((result) => result.caseId))];
const repeatability = cases.map((caseId) => {
  const observations = run.cases.filter((result) => result.caseId === caseId);
  const outcomes = [...new Set(observations.map((result) => result.outcome))];
  return { caseId, observations: observations.length, outcome: outcomes.length === 1 ? outcomes[0] : 'NON_REPEATABLE' };
});

const outcomeOrder: Outcome[] = ['PASS', 'FAIL', 'PARTIAL', 'INCONCLUSIVE', 'NOT_EVALUABLE'];
const summaryRows = outcomeOrder
  .filter((outcome) => counts.has(outcome))
  .map((outcome) => `<tr><td>${outcome}</td><td>${counts.get(outcome)}</td></tr>`)
  .join('');
const resultRows = run.cases.map((result) => `<tr>
  <td>${escapeHtml(result.caseId)}</td>
  <td>${result.repetition}</td>
  <td>${result.turn}</td>
  <td>${escapeHtml(result.conversationId)}</td>
  <td><span class="status ${result.outcome.toLowerCase()}">${result.outcome}</span></td>
  <td>${result.evidenceInsufficient ? 'Yes' : 'No'}</td>
  <td>${escapeHtml(result.channel || '—')}</td>
  <td>${escapeHtml(result.botVersion || '—')}</td>
</tr>`).join('');
const repeatabilityRows = repeatability.map((item) => `<tr><td>${escapeHtml(item.caseId)}</td><td>${item.observations}</td><td>${escapeHtml(item.outcome)}</td></tr>`).join('');

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Evaluation report</title>
<style>
body{font-family:system-ui,sans-serif;margin:0;background:#f6f7f9;color:#20242a}main{max-width:1200px;margin:0 auto;padding:32px}h1{margin-bottom:4px}h2{margin-top:32px}.meta,.cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:12px}.card,section{background:#fff;border:1px solid #dfe3e8;border-radius:10px;padding:16px}.card strong{display:block;font-size:24px;margin-top:6px}table{width:100%;border-collapse:collapse;background:#fff}th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e7eb}th{background:#f1f3f5}.status{font-weight:700}.pass{color:#176b3a}.fail{color:#a51d2d}.partial{color:#9a6700}.inconclusive,.not_evaluable{color:#555}.decision{font-size:20px;font-weight:700}.muted{color:#69717d}.bar{height:18px;background:#e9ecef;border-radius:9px;overflow:hidden}.segment{height:100%;display:inline-block}.segment.pass{background:#176b3a}.segment.fail{background:#a51d2d}.segment.partial{background:#9a6700}.segment.inconclusive{background:#777}.segment.not_evaluable{background:#555}
</style></head><body><main>
<h1>Semantic evaluation report</h1><p class="muted">Generated from normalized evaluation results; the report does not depend on the bot channel or provider.</p>
<section><div class="decision">Decision: <span class="status ${run.status === 'VALIDATED_REPEATABILITY' ? 'pass' : 'fail'}">${run.status}</span></div><p>Observations: ${run.cases.length} · Cases: ${cases.length}</p></section>
<h2>Execution context</h2><div class="meta">
<div class="card">Observation schema<strong>${escapeHtml(run.observationSchemaVersion)}</strong></div>
<div class="card">Evaluator model<strong>${escapeHtml(run.evaluator.modelId)}</strong></div>
<div class="card">Model version<strong>${escapeHtml(run.evaluator.modelVersion)}</strong></div>
<div class="card">Prompt version<strong>${escapeHtml(run.evaluator.promptVersion)}</strong></div>
<div class="card">Method version<strong>${escapeHtml(run.evaluator.methodVersion)}</strong></div>
<div class="card">Source<strong>${escapeHtml(run.observationsFile)}</strong></div>
</div>
<h2>Outcome distribution</h2><section><div class="bar">${outcomeOrder.map((outcome) => `<span class="segment ${outcome.toLowerCase()}" style="width:${((counts.get(outcome)||0)/run.cases.length)*100}%"></span>`).join('')}</div><table><thead><tr><th>Outcome</th><th>Count</th></tr></thead><tbody>${summaryRows}</tbody></table></section>
<h2>Results and traceability</h2><section><table><thead><tr><th>Case</th><th>Rep.</th><th>Turn</th><th>Conversation</th><th>Outcome</th><th>Evidence insufficient</th><th>Channel</th><th>Bot version</th></tr></thead><tbody>${resultRows}</tbody></table></section>
<h2>Repeatability</h2><section><table><thead><tr><th>Case</th><th>Observations</th><th>Result</th></tr></thead><tbody>${repeatabilityRows}</tbody></table></section>
<h2>Interpretation</h2><section><p>This report intentionally does not calculate a synthetic global quality score. Results remain attributable to individual cases, evidence and provenance.</p></section>
</main></body></html>`;

await writeFile(outputFile, html, 'utf8');
console.log(JSON.stringify({ status: 'REPORT_GENERATED', inputFile, outputFile }, null, 2));
