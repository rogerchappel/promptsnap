# Agent Instructions

promptsnap is a local-first TypeScript CLI for prompt snapshot testing.

## Rules

- Keep runtime behavior deterministic and offline.
- Do not add hidden network calls, hosted model calls, telemetry, or remote storage.
- Redaction must happen before snapshot writes.
- Changed snapshots should be committed only with intentional prompt-contract changes.

## Verify

Run the smallest relevant gate while working, then the full gate before handoff:

```sh
npm run check
npm run build
npm test
npm run smoke
bash scripts/validate.sh
```

## Important Paths

- `src/cli.ts` command parsing and exit codes.
- `src/run.ts` snapshot comparison workflow.
- `src/redact.ts` redaction engine.
- `fixtures/basic` smoke fixture.
- `docs/ORCHESTRATION.md` agent workflow.
