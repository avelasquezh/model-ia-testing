import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    ignores: ['node_modules/**', 'dist/**', 'artifacts/**', 'test-results/**', 'playwright-report/**'],
  },
  ...tseslint.configs.recommended,
);
