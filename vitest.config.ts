import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'spike/**/*.test.ts'],
    exclude: ['node_modules/**', 'spike/browser/**'],
  },
});
