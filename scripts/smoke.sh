#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cp -R "$ROOT/fixtures/basic/." "$TMP/"
(
  cd "$TMP"
  node "$ROOT/dist/cli.js" update prompts --format json > update.json
  node "$ROOT/dist/cli.js" check prompts --format markdown > check.md
)

grep -q '"ok": true' "$TMP/update.json"
grep -q '# promptsnap check passed' "$TMP/check.md"
