# Contributing

Thanks for helping improve promptsnap.

## Local Setup

```sh
npm install
npm run build
npm test
npm run smoke
```

## Change Guidelines

- Keep the CLI deterministic and local-first.
- Do not add telemetry, hosted LLM calls, or implicit network behavior.
- Add tests for normalization, redaction, token budgets, and CLI exit-code changes.
- Commit snapshot changes only when prompt-contract drift is intentional.
- Prefer small, reviewable pull requests.

## Verification

Before opening a PR, run:

```sh
npm run release:check
bash scripts/validate.sh
```

If a command cannot be run, explain why in the PR.
