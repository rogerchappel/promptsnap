#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

TARBALL="$(cd "$ROOT" && npm pack --silent --pack-destination "$TMP")"
CONSUMER="$TMP/consumer"
mkdir -p "$CONSUMER"

(
  cd "$CONSUMER"
  npm init --yes --silent >/dev/null
  npm install --silent "$TMP/$TARBALL"

  ./node_modules/.bin/promptsnap --help > help.txt
  grep -q 'Usage:' help.txt

  npx --no-install promptsnap --version > version.txt
  grep -qx '0.1.0' version.txt

  ./node_modules/.bin/promptsnap init > init.txt
  test -f promptsnap.config.json
  test -f prompts/example.prompt.md

  if ./node_modules/.bin/promptsnap invalid-command > invalid.stdout 2> invalid.stderr; then
    echo "invalid command unexpectedly succeeded" >&2
    exit 1
  fi
  grep -q 'Unknown command: invalid-command' invalid.stderr
)
