# Contributing

## Branch policy

`main` is the release/integration branch. Do not develop directly on `main`.

Use `qa` for integration of changes that are still under validation. Feature or fix branches should be created from `qa` when the work is larger than a single atomic change.

## Verification flow

Before proposing a change for `main`, the change must pass the QA preflight gate:

1. ESLint with zero warnings.
2. TypeScript compilation.
3. Unit and architecture tests.
4. Cucumber BDD tests.
5. Playwright browser tests.
6. PostgreSQL migration and integration tests.

The `QA Preflight Gate` workflow runs automatically on pushes to `qa` and on pull requests targeting `main`.

The `Architecture Spike` workflow remains an additional technical validation layer for pull requests to `main`.

## Main policy

A change is eligible for `main` only through a pull request whose required checks are green. Direct pushes to `main` must be disabled in repository branch protection/rulesets so CI results cannot be bypassed.

Do not merge a failing, cancelled, or incomplete validation run.
