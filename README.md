# promptsnap

Golden-file snapshot testing for prompts, skills, and agent instruction packs — deterministic, redaction-aware, and friendly to code review.

## Why

Prompt changes can quietly alter behavior contracts. `promptsnap` gives local-first teams a simple way to normalize prompt artifacts, redact risky values, assert approximate token budgets, and review crisp diffs. It does **not** call LLM APIs.

## Install

```sh
npm install --save-dev promptsnap
```

The npm package is not published yet. Until the first tagged release, install
from a checked-out source tree using the local-development steps below.

During local development in this repo:

```sh
npm install
npm run build
```

## Quickstart

```sh
npx promptsnap init
npx promptsnap update prompts
npx promptsnap check --format markdown
npx promptsnap diff --format markdown
```

Snapshots are written to `__snapshots__/` by default. Commit snapshot changes alongside intentional prompt changes.

## Config

`promptsnap.config.json` controls discovery, normalization, redaction, and budgets:

```json
{
  "include": ["prompts/**/*.md", "skills/**/*.md", "*.prompt.md"],
  "exclude": ["__snapshots__/**", "node_modules/**", ".git/**", "dist/**"],
  "snapshotDir": "__snapshots__",
  "normalizers": ["line-endings", "trim-trailing-whitespace", "final-newline"],
  "redactions": [
    { "name": "bearer-token", "pattern": "(?i)Bearer\\s+[A-Za-z0-9._~+/=-]{16,}", "replacement": "Bearer [REDACTED]" }
  ],
  "tokenBudget": { "maxTokens": 8000, "warnTokens": 6000 }
}
```

## Commands

- `promptsnap init [--force]` creates a config and sample prompt.
- `promptsnap update [paths...]` writes or refreshes snapshots.
- `promptsnap check [paths...]` exits non-zero for missing, changed, or over-budget snapshots.
- `promptsnap diff [paths...] --format markdown` prints review-friendly diffs.

Formats: `text`, `json`, `markdown`.

## CI Example

```yaml
- run: npm ci
- run: npm run release:check
- run: npx promptsnap check --format markdown
```

## Safety

- Runtime is local-only and deterministic.
- No hidden network calls, model calls, telemetry, or remote storage.
- Common secrets, bearer tokens, private keys, and user-home paths are redacted before snapshot writes.
- Treat snapshots as source artifacts: review them before committing.

## Verify

```sh
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

## License

MIT

## Release Readiness

Use the checked-in scripts before opening or publishing a release:

```sh
npm run check
npm test
npm run smoke
npm run package:smoke
npm run release:check
```

`npm test` builds the TypeScript sources before running the compiled test suite,
so it is safe to run directly after `npm ci` in a clean checkout.

The package smoke packs the project, installs the tarball into a clean temporary
consumer, and exercises the installed `promptsnap` bin through both its local
shim and `npx --no-install`. It does not publish the package.

## Development

Run the same local checks that protect the package before opening a release or pull request:

- `npm run build`
- `npm test`
- `npm run check`
- `npm run smoke`
- `npm run package:smoke`
- `npm run release:check`
