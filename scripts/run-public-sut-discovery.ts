import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { classifyPublicSutFailure } from '../src/infrastructure/execution/playwright/PublicSutFailureClassification.js';

const configFile = process.env.BROWSER_SUT_CONFIG_FILE;
const outputFile = process.env.BROWSER_SUT_DISCOVERY_REPORT_FILE ?? 'artifacts/public-sut-discovery/discovery.json';

if (!configFile) throw new Error('BROWSER_SUT_CONFIG_FILE is required');

const config = JSON.parse(await readFile(configFile, 'utf8')) as { target?: { url?: string } };
const startedAt = new Date().toISOString();

const result = await new Promise<{ code: number; error?: string }>((resolvePromise) => {
  const child = spawn('npx', ['tsx', 'scripts/run-browser-sut.ts'], {
    stdio: 'inherit',
    env: process.env,
    shell: process.platform === 'win32',
  });
  child.on('error', (error) => resolvePromise({ code: 1, error: error.message }));
  child.on('close', (code, signal) => resolvePromise({
    code: code ?? 1,
    error: signal ? `process terminated by ${signal}` : undefined,
  }));
});

try {
  await readFile(outputFile, 'utf8');
} catch {
  const fallbackError = {
    code: result.code === 0 ? 'DISCOVERY_NO_REPORT' : 'EXECUTION_FAILED',
    message: result.error ?? `browser:sut exited with code ${result.code}`,
    operation: 'OPEN',
  };
  await mkdir(dirname(resolve(outputFile)), { recursive: true });
  await writeFile(outputFile, JSON.stringify({
    schemaVersion: 'chat-discovery-0.1',
    targetUrl: config.target?.url ?? 'unknown',
    status: 'FAILED',
    discoveredAt: startedAt,
    candidates: [],
    selected: {},
    failureReason: classifyPublicSutFailure(fallbackError),
    error: fallbackError.message,
  }, null, 2));
}

console.log(JSON.stringify({
  targetUrl: config.target?.url,
  status: result.code === 0 ? 'DISCOVERED_OR_EXECUTED' : 'FAILED',
  ...(result.error ? { error: result.error } : {}),
}, null, 2));
