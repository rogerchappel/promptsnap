# promptsnap

Golden-file snapshot testing for prompts, skills, and agent instruction packs — deterministic, redaction-aware, and friendly to code review.

## Why

Prompt changes can quietly alter behavior contracts. `promptsnap` gives local-first teams a simple way to normalize prompt artifacts, redact risky values, assert approximate token budgets, and review crisp diffs. It does **not** call LLM APIs.

## Install

The npm package is not published yet. Until the first tagged release, clone the
repository and build the CLI from source:

```sh
git clone https://github.com/rogerchappel/promptsnap.git
cd promptsnap
npm ci
npm run build
node dist/cli.js --help
```

The final command runs the built CLI directly and prints its usage. You can use
`node dist/cli.js` in place of `promptsnap` in the examples below while working
from a source checkout.

After the package is published to npm, install it in another project with:

```sh
npm install --save-dev promptsnap
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

The config file is validated when a command loads it. Invalid JSON, unknown fields,
unsupported normalizers, malformed redaction rules, and invalid token budgets fail
with the config path and exact offending field. All fields are optional; omitted
fields (including individual `tokenBudget` values) retain their defaults.

## Commands

- `promptsnap init [--force]` creates a config and a missing sample prompt. `--force`
  replaces only the config and preserves an existing `prompts/example.prompt.md`.
- `promptsnap update [paths...]` writes or refreshes snapshots. A full, config-driven update also removes valid promptsnap records whose source is no longer discovered; unrelated and malformed files are preserved.
- `promptsnap check [paths...]` exits non-zero for missing, changed, stale, or over-budget snapshots. Stale reconciliation runs only without explicit paths, so a scoped check does not report snapshots for unselected sources.
- `promptsnap diff [paths...] --format markdown` prints review-friendly diffs.

Token estimates above `warnTokens` and at or below `maxTokens` are reported as warnings in text, JSON, and Markdown output. Warnings do not make a command fail; estimates above `maxTokens` remain failing over-budget results.

Formats: `text`, `json`, `markdown`.

Command options are strict: `--force` is valid only for `init`, while `--format`
is valid only for `check`, `update`, and `diff`. Repeated paths and overlapping
directory/file inputs are deduplicated, so each source is processed once.

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
