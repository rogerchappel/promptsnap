# PRD: promptsnap

Status: in-progress
Decision: selected for OSS factory build on 2026-05-10

## Scorecard

Total: 83/100
Band: build now
Last scored: 2026-05-07
Scored by: Neo

| Criterion | Points | Notes |
|---|---:|---|
| Problem pain | 17/20 | Teams change prompts, skills, agent instructions, and CLI text fixtures without seeing exactly how behavior contracts drift. |
| Demand signal | 15/20 | Snapshot testing is a proven developer workflow; agent/prompt repositories increasingly need the same golden-file discipline. |
| V1 buildability | 19/20 | A local CLI can normalize prompt packs, run deterministic transforms, and compare expected snapshots without LLM calls. |
| Differentiation | 13/15 | It is prompt/agent-contract focused, with redaction, token budgets, and review-friendly diffs instead of generic text snapshots. |
| Agentic workflow leverage | 15/15 | Agents can run it before changing skills/prompts to prove the contract drift is intentional. |
| Distribution potential | 4/10 | Strong niche among prompt engineers, agent framework maintainers, and local-first AI developers. |

## Pitch

Golden-file snapshot testing for prompts, skills, and agent instruction packs — deterministic, redaction-aware, and friendly to code review. 📸

## Why It Matters

Prompt and skill changes can quietly alter behavior. Ordinary tests often miss the boring but important contract drift: a safety note disappeared, a tool list changed, a token budget exploded, or an example no longer matches the documented interface.

`promptsnap` gives agent developers a simple local workflow: define prompt fixtures, normalize them, redact secrets, assert budgets, and review crisp diffs. It does not call an LLM in V1; it tests the prompt artifacts themselves.

## Attribution / Inspiration

Inspired by Jest/Vitest snapshot workflows, approval testing, and the growing practice of storing agent instructions/skills as versioned files. This is a renamed/reframed prompt-contract tool, not copied from any specific implementation.

## V1 Scope

- CLI: `promptsnap init`, `promptsnap check`, `promptsnap update`, `promptsnap diff`.
- Config file: `promptsnap.config.json` with include globs, redaction rules, token budget estimates, and normalizers.
- Snapshot format stored under `__snapshots__/`.
- Redact likely secrets and user-specific paths before snapshot writes.
- Deterministic approximate token counts and max-budget assertions.
- Markdown/JSON summary output for CI and agents.
- Fixture-backed tests for update/check/diff flows.

## Out of Scope

- Calling hosted LLM APIs.
- Evaluating model answer quality.
- Storing private prompt content outside the local repo.
- Replacing full eval frameworks.

## CLI/API Sketch

```bash
promptsnap init
promptsnap check ./skills ./prompts
promptsnap update --accept
promptsnap diff --format markdown
```

## Verification

- Unit tests for normalization, redaction, token estimation, snapshot comparison, and CLI exit codes.
- CLI smoke tests with local prompt fixtures.
- README with quickstart, CI example, review workflow, and safety notes.
