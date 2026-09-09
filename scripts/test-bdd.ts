import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawn } from 'node:child_process';

const tempDirectory = await mkdtemp(join(tmpdir(), 'model-ia-testing-bdd-'));
const reportPath = join(tempDirectory, 'cucumber.json');

const args = [
  'spike/bdd/**/*.feature',
  '--import',
  './spike/bdd/tsx-register.mjs',
  '--import',
  'spike/bdd/**/*.steps.ts',
  '--format',
  `json:${reportPath}`,
  '--format',
  'progress',
];

try {
  const exitCode = await new Promise<number>((resolve, reject) => {
    const child = spawn('cucumber-js', args, {
      stdio: 'inherit',
      shell: false,
    });

    child.on('error', reject);
    child.on('close', (code) => resolve(code ?? 1));
  });

  if (exitCode !== 0) {
    throw new Error(`Cucumber exited with status ${exitCode}`);
  }

  const rawReport = await readFile(reportPath, 'utf8');
  const report: unknown = JSON.parse(rawReport);
  const scenarioCount = countScenarios(report);

  if (scenarioCount === 0) {
    throw new Error('BDD quality gate failed: Cucumber executed 0 scenarios.');
  }

  console.log(`BDD quality gate: ${scenarioCount} scenario(s) executed.`);
} finally {
  await rm(tempDirectory, { recursive: true, force: true });
}

function countScenarios(value: unknown): number {
  if (Array.isArray(value)) {
    return value.reduce((total, item) => total + countScenarios(item), 0);
  }

  if (value !== null && typeof value === 'object') {
    const record = value as Record<string, unknown>;
    const ownCount = record.type === 'scenario' ? 1 : 0;
    return ownCount + Object.values(record).reduce(
      (total, child) => total + countScenarios(child),
      0,
    );
  }

  return 0;
}
