#!/usr/bin/env bash
# tgsend.sh — Telegram send wrapper. Reads bot token from ~/.mac_companion/token.
# Usage:
#   tgsend.sh text "message"
#   tgsend.sh doc   <file> ["caption"]
#   tgsend.sh photo <file> ["caption"]
# Prints nothing on success; prints an error line and exits non-zero on failure.
set -euo pipefail

TOKEN_FILE="${HOME}/.mac_companion/token"
CHAT_ID="1117739189"

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

if [[ ! -f "$TOKEN_FILE" ]]; then
  echo "tgsend.sh: token file not found: $TOKEN_FILE" >&2
  exit 1
fi
TOKEN="$(cat "$TOKEN_FILE")"
API="https://api.telegram.org/bot${TOKEN}"

http_status=""
body=""

case "$mode" in
  text)
    msg="$1"
    response="$(curl -sS -w '\n%{http_code}' -X POST "${API}/sendMessage" \
      --data-urlencode "chat_id=${CHAT_ID}" \
      --data-urlencode "text=${msg}")"
    ;;
  doc)
    file="$1"
    caption="${2:-}"
    response="$(curl -sS -w '\n%{http_code}' -X POST "${API}/sendDocument" \
      -F "chat_id=${CHAT_ID}" \
      -F "document=@${file}" \
      -F "caption=${caption}")"
    ;;
  photo)
    file="$1"
    caption="${2:-}"
    response="$(curl -sS -w '\n%{http_code}' -X POST "${API}/sendPhoto" \
      -F "chat_id=${CHAT_ID}" \
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
