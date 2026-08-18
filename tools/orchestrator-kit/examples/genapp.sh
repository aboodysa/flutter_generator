#!/usr/bin/env bash
# genapp.sh — the approve -> generate -> validate triple used every regeneration.
# Usage: genapp.sh <ir-file> <out-dir>
# Prints one line per stage result; exits non-zero on the first stage that fails.
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"

usage() {
  echo "usage: genapp.sh <ir-file> <out-dir>" >&2
}

if [[ $# -ne 2 || "$1" == "-h" || "$1" == "--help" ]]; then
  usage
  [[ "${1:-}" == "-h" || "${1:-}" == "--help" ]] && exit 0
  exit 1
fi

ir="$1"
out="$2"

if [[ ! -f "$ir" ]]; then
  echo "genapp.sh: IR file not found: $ir" >&2
  exit 1
fi

cd "$REPO_ROOT"

log="$(mktemp)"
trap 'rm -f "$log"' EXIT

if npx ts-node --transpile-only builder/src/approve.ts "$ir" >"$log" 2>&1; then
  echo "[approve] $(tail -n1 "$log")"
else
  echo "[approve] FAIL — $(tail -n1 "$log")"
  exit 1
fi

if npx ts-node --transpile-only builder/src/index.ts "$ir" "$out" >"$log" 2>&1; then
  echo "[generate] $(tail -n1 "$log")"
else
  echo "[generate] FAIL — $(tail -n1 "$log")"
  exit 1
fi

if npx ts-node --transpile-only builder/src/validate.ts "$ir" "$out" >"$log" 2>&1; then
  echo "[validate] $(tail -n1 "$log")"
  exit 0
else
  echo "[validate] $(grep -m1 '^\[verdict\]' "$log" || tail -n1 "$log")"
  exit 1
fi
