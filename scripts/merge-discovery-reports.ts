import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';

type Candidate = {
  readonly role: 'launcher' | 'composer' | 'sendButton' | 'response';
  readonly strategy: string;
  readonly matched: boolean;
  readonly count: number;
  readonly selected: boolean;
  readonly confidence: 'HIGH' | 'MEDIUM' | 'LOW';
  readonly element?: Record<string, unknown>;
};

type Report = {
  readonly schemaVersion: 'chat-discovery-0.1';
  readonly targetUrl: string;
  readonly status: 'DISCOVERED' | 'FAILED';
  readonly discoveredAt: string;
  readonly candidates: readonly Candidate[];
  readonly selected: Record<string, unknown>;
  readonly error?: string;
  readonly failureReason?: string;
};

const inputDirectory = resolve(process.argv[2] ?? 'artifacts/public-sut-discovery');
const outputFile = resolve(process.argv[3] ?? 'artifacts/public-sut-discovery/locator-candidate-registry.json');

const files = (await readdir(inputDirectory, { withFileTypes: true }))
  .filter((entry) => entry.isFile() && entry.name.endsWith('.json'))
  .map((entry) => entry.name)
  .sort();

const reports: Report[] = [];
for (const file of files) {
  try {
    const value = JSON.parse(await readFile(join(inputDirectory, file), 'utf8')) as Report;
    if (value?.schemaVersion !== 'chat-discovery-0.1' || typeof value.targetUrl !== 'string' || !Array.isArray(value.candidates)) continue;
    reports.push(value);
  } catch {
    // Ignore unrelated JSON artifacts; discovery evidence remains append-only.
  }
}

const candidates = reports.flatMap((report) =>
  report.candidates.map((candidate) => ({
    ...candidate,
    targetUrl: report.targetUrl,
    discoveryStatus: report.status,
    discoveredAt: report.discoveredAt,
  })),
);

const registry = {
  schemaVersion: 'locator-candidate-registry-0.1',
  generatedAt: new Date().toISOString(),
  sourceSchemaVersion: 'chat-discovery-0.1',
  sites: reports.map((report) => ({
    targetUrl: report.targetUrl,
    status: report.status,
    discoveredAt: report.discoveredAt,
    selected: report.selected,
    ...(report.failureReason ? { failureReason: report.failureReason } : {}),
    ...(report.error ? { error: report.error } : {}),
  })),
  candidates,
  summary: {
    sites: reports.length,
    discoveredSites: reports.filter((report) => report.status === 'DISCOVERED').length,
    failedSites: reports.filter((report) => report.status === 'FAILED').length,
    totalCandidates: candidates.length,
    matchedCandidates: candidates.filter((candidate) => candidate.matched).length,
    selectedCandidates: candidates.filter((candidate) => candidate.selected).length,
  },
};

await mkdir(resolve(outputFile, '..'), { recursive: true });
await writeFile(outputFile, JSON.stringify(registry, null, 2));
console.log(JSON.stringify(registry.summary, null, 2));
