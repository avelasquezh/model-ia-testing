import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import { dirname, resolve } from 'node:path';

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
  await mkdir(dirname(resolve(outputFile)), { recursive: true });
  await writeFile(outputFile, JSON.stringify({
    schemaVersion: 'chat-discovery-0.1',
    targetUrl: config.target?.url ?? 'unknown',
    status: 'FAILED',
    discoveredAt: startedAt,
    candidates: [],
    selected: {},
    failureReason: classifyFailure(result.error, result.code),
    error: result.error ?? `browser:sut exited with code ${result.code}`,
  }, null, 2));
}

console.log(JSON.stringify({
  targetUrl: config.target?.url,
  status: result.code === 0 ? 'DISCOVERED_OR_EXECUTED' : 'FAILED',
  ...(result.error ? { error: result.error } : {}),
}, null, 2));

function classifyFailure(error: string | undefined, code: number): string {
  const value = (error ?? '').toLowerCase();
  if (value.includes('timeout')) return 'TIMEOUT';
  if (value.includes('frame') || value.includes('cross-origin') || value.includes('blocked')) return 'FRAME_BLOCKED';
  if (value.includes('navigation') || value.includes('net::')) return 'NAVIGATION_FAILED';
  if (value.includes('launcher')) return 'NO_LAUNCHER';
  if (value.includes('composer')) return 'NO_COMPOSER';
  if (value.includes('send')) return 'NO_SEND';
  if (value.includes('response')) return 'NO_RESPONSE';
  return code === 0 ? 'DISCOVERY_NO_REPORT' : 'EXECUTION_FAILED';
}
