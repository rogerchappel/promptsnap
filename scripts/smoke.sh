#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

cp -R "$ROOT/fixtures/basic/." "$TMP/"
node "$ROOT/dist/cli.js" update "$TMP/prompts" --format json > "$TMP/update.json"
node "$ROOT/dist/cli.js" check "$TMP/prompts" --format markdown > "$TMP/check.md"

grep -q '"ok": true' "$TMP/update.json"
grep -q '# promptsnap check passed' "$TMP/check.md"
