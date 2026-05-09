# ORCHESTRATION

promptsnap is intentionally local-first and deterministic.

## Agent Workflow

1. Read the prompt, skill, or agent-instruction change.
2. Run `npm run build` if source changed.
3. Run `promptsnap update` only when the new prompt contract is intentional.
4. Run `promptsnap check --format markdown` before review.
5. Include changed snapshots in the same review as the prompt change.

## Safety Gates

- The CLI performs no network calls.
- Snapshot output is redacted before writing.
- Token budgets fail the run when configured maximums are exceeded.
- CI should run `npm run release:check` for build, tests, smoke, and package dry-run.

## Recommended CI Step

```sh
npm ci
npm run release:check
```
