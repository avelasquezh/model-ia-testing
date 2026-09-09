import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';

const configFile = process.env.BROWSER_SUT_CONFIG_FILE;
const outputFile = process.env.BROWSER_SUT_DISCOVERY_REPORT_FILE ?? 'artifacts/public-sut-discovery/discovery.json';

if (!configFile) throw new Error('BROWSER_SUT_CONFIG_FILE is required');

const config = JSON.parse(await readFile(configFile, 'utf8')) as { target?: { url?: string } };
const startedAt = new Date().toISOString();

const result = await new Promise<{ code: number }>((resolvePromise) => {
  const child = spawn('npx', ['tsx', 'scripts/run-browser-sut.ts'], {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  child.on('error', () => resolvePromise({ code: 1 }));
  child.on('close', (code) => resolvePromise({ code: code ?? 1 }));
});

try {
  await readFile(outputFile, 'utf8');
} catch {
  await mkdir(dirname(resolve(outputFile)), { recursive: true });
  await writeFile(outputFile, JSON.stringify({
    schemaVersion: 'chat-discovery-0.1',
    targetUrl: config.target?.url ?? 'unknown',
    status: 'FAILED',
    discoveredAt: startedAt,
    candidates: [],
    selected: {},
    error: `browser:sut exited with code ${result.code}`,
  }, null, 2));
}

console.log(JSON.stringify({ targetUrl: config.target?.url, status: result.code === 0 ? 'DISCOVERED_OR_EXECUTED' : 'FAILED' }));
