# TASKS

## MVP

- [x] Scaffold a TypeScript CLI package from StackForge.
- [x] Add `promptsnap init` for a local config and sample prompt.
- [x] Add `promptsnap update` to write deterministic snapshots.
- [x] Add `promptsnap check` to fail on missing, changed, or over-budget prompts.
- [x] Add `promptsnap diff` with review-friendly unified diffs.
- [x] Support `text`, `json`, and `markdown` summaries.
- [x] Redact common secrets and user-home paths before snapshot writes.
- [x] Estimate token budgets without LLM or network calls.
- [x] Add fixture-backed tests and CLI smoke coverage.
- [x] Document local-first safety and review workflow.

## Post-MVP

- [ ] Add richer glob syntax if users need brace/extglob support.
- [ ] Add snapshot pruning for deleted prompt files.
- [ ] Add SARIF or GitHub annotation output.
- [ ] Add config schema publishing.
