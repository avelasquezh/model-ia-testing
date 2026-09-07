import { createHash } from 'node:crypto';
import { readdir, readFile, stat, writeFile } from 'node:fs/promises';
import { join, relative } from 'node:path';

const required = ['GITHUB_RUN_ID', 'GITHUB_SHA', 'GITHUB_WORKFLOW', 'GITHUB_REF'];
for (const name of required) {
  if (!process.env[name]?.trim()) throw new Error(`${name} is required to create evidence manifest`);
}

const roots = ['artifacts', 'test-results', 'playwright-report'];

type EvidenceFile = {
  path: string;
  sizeBytes: number;
  sha256: string;
};

async function collectFiles(root: string): Promise<EvidenceFile[]> {
  const files: EvidenceFile[] = [];

  async function visit(directory: string): Promise<void> {
    const entries = await readdir(directory, { withFileTypes: true }).catch(() => []);
    for (const entry of entries) {
      const fullPath = join(directory, entry.name);
      if (entry.isDirectory()) {
        await visit(fullPath);
        continue;
      }
      if (!entry.isFile()) continue;
      const content = await readFile(fullPath);
      const fileStats = await stat(fullPath);
      files.push({
        path: relative(process.cwd(), fullPath).replaceAll('\\', '/'),
        sizeBytes: fileStats.size,
        sha256: createHash('sha256').update(content).digest('hex'),
      });
    }
  }

  await visit(root);
  return files;
}

const files = (await Promise.all(roots.map(collectFiles))).flat().sort((a, b) => a.path.localeCompare(b.path));
const manifest = {
  schemaVersion: '1.0',
  gate: 'SPIKE-008',
  workflow: process.env.GITHUB_WORKFLOW,
  runId: process.env.GITHUB_RUN_ID,
  runUrl: `https://github.com/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`,
  commitSha: process.env.GITHUB_SHA,
  ref: process.env.GITHUB_REF,
  generatedAt: new Date().toISOString(),
  evidenceFiles: files,
};

if (files.length === 0) {
  throw new Error('SPIKE-008 requires at least one evidence file');
}

await writeFile('artifacts/spike-008-evidence-manifest.json', `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(JSON.stringify(manifest, null, 2));
