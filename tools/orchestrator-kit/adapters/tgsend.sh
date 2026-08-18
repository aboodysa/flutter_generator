#!/usr/bin/env bash
# tgsend.sh — Telegram send wrapper (orchestrator-kit adapter).
# Token file and chat id come from config.env (ORCH_TG_TOKEN_FILE / ORCH_TG_CHAT_ID), with the
# defaults below applied when config.env is absent or leaves them unset.
# Usage:
#   tgsend.sh text "message"
#   tgsend.sh doc   <file> ["caption"]
#   tgsend.sh photo <file> ["caption"]
# Prints nothing on success; prints an error line and exits non-zero on failure.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
# shellcheck source=../core/init.sh
source "$SCRIPT_DIR/../core/init.sh"

: "${ORCH_TG_TOKEN_FILE:="${HOME}/.mac_companion/token"}"
: "${ORCH_TG_CHAT_ID:="1117739189"}"

usage() {
  cat >&2 <<'EOF'
usage:
  tgsend.sh text "message"
  tgsend.sh doc   <file> ["caption"]
  tgsend.sh photo <file> ["caption"]
EOF
}

if [[ $# -lt 1 ]]; then
  usage
  exit 1
fi

mode="$1"
shift || true

case "$mode" in
  text)
    if [[ $# -lt 1 || -z "${1:-}" ]]; then
      usage
      exit 1
    fi
    ;;
  doc|photo)
    if [[ $# -lt 1 || -z "${1:-}" ]]; then
      usage
      exit 1
    fi
    if [[ ! -f "$1" ]]; then
      echo "tgsend.sh: file not found: $1" >&2
      exit 1
    fi
    ;;
  -h|--help)
    usage
    exit 0
    ;;
  *)
    usage
    exit 1
    ;;
esac

if [[ ! -f "$ORCH_TG_TOKEN_FILE" ]]; then
  echo "tgsend.sh: token file not found: $ORCH_TG_TOKEN_FILE" >&2
  exit 1
fi
TOKEN="$(cat "$ORCH_TG_TOKEN_FILE")"
API="https://api.telegram.org/bot${TOKEN}"

case "$mode" in
  text)
    msg="$1"
    response="$(curl -sS -w '\n%{http_code}' -X POST "${API}/sendMessage" \
      --data-urlencode "chat_id=${ORCH_TG_CHAT_ID}" \
      --data-urlencode "text=${msg}")"
    ;;
  doc)
    file="$1"
    caption="${2:-}"
    response="$(curl -sS -w '\n%{http_code}' -X POST "${API}/sendDocument" \
      -F "chat_id=${ORCH_TG_CHAT_ID}" \
      -F "document=@${file}" \
      -F "caption=${caption}")"
    ;;
  photo)
    file="$1"
    caption="${2:-}"
    response="$(curl -sS -w '\n%{http_code}' -X POST "${API}/sendPhoto" \
      -F "chat_id=${ORCH_TG_CHAT_ID}" \
      -F "photo=@${file}" \
      -F "caption=${caption}")"
    ;;
esac

http_status="$(echo "$response" | tail -n1)"
body="$(echo "$response" | sed '$d')"

if [[ "$http_status" != "200" ]]; then
  echo "tgsend.sh: send failed (HTTP ${http_status}): ${body}" >&2
  exit 1
fi
