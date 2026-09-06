export type AppConfig = {
  readonly environment: string;
  readonly targetTimeoutMs: number;
};

export function loadConfig(env: NodeJS.ProcessEnv): AppConfig {
  const environment = env.NODE_ENV;
  const timeout = Number(env.TARGET_TIMEOUT_MS ?? '30000');

  if (!environment) throw new Error('NODE_ENV is required');
  if (!Number.isInteger(timeout) || timeout <= 0) {
    throw new Error('TARGET_TIMEOUT_MS must be a positive integer');
  }

  return { environment, targetTimeoutMs: timeout };
}
