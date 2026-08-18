#!/usr/bin/env bash
# poll.sh — collapse tmux-pane polling loops into one call that prints only on a meaningful event.
# Usage: poll.sh --lane <tmux-session> [--until <sha>] [--idle] [--timeout <mins>] [--quiet] [--report]
#   --until <sha>   success once <sha> (full or short) appears in the pane's visible text.
#   --idle          success once the pane's last non-blank line ends with an idle `❯` prompt.
#                    If BOTH --until and --idle are given, success requires the SHA to have
#                    appeared AND the lane to now be idle (commit landed, agent done).
#   --timeout <m>   minutes before giving up (default 10).
#   --quiet         suppress the one-line status output entirely (exit code only).
#   --report        also print the last meaningful (non-blank) pane line, useful under --quiet.
# Exit: 0 on success, 1 on timeout or a visible FAIL/Error, 2 on a bad/missing tmux session.
set -uo pipefail

POLL_INTERVAL=5
FAIL_RE='(FAIL|FAILED|Error:|error:|Exception|Traceback)'
# Idle = a line starting with the `❯` prompt is visible AND no busy-spinner status line is
# present. Tuned against live local Claude Code TUI panes (verified on s-hermetic/claude-review/
# product-plan-opus/p5d2-slice3/claude-plan-spikes 2026-08-18): a bare `❯` line is present in BOTH
# the busy state (persistent input box) and the idle state, so `❯` alone is not sufficient — the
# busy state additionally carries a "thought for Ns)" spinner line that the idle "✻ <verb> for Ns /
# new task?" summary line does not. Remote opencode-flavored lanes may render differently; if idle
# never triggers there, this regex needs a lane-specific update (documented limitation).
IDLE_PROMPT_RE='^❯'
BUSY_RE='thought for [0-9]+s\)'

usage() {
  cat >&2 <<'EOF'
usage: poll.sh --lane <tmux-session> [--until <sha>] [--idle] [--timeout <mins>] [--quiet] [--report]
  at least one of --until/--idle is required.
EOF
}

lane=""
until_sha=""
want_idle=false
timeout_min=10
quiet=false
report=false

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --lane) lane="${2:-}"; shift 2 ;;
    --until) until_sha="${2:-}"; shift 2 ;;
    --idle) want_idle=true; shift ;;
    --timeout) timeout_min="${2:-}"; shift 2 ;;
    --quiet) quiet=true; shift ;;
    --report) report=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done

if [[ -z "$lane" ]]; then
  usage
  exit 1
fi
if [[ -z "$until_sha" && "$want_idle" == false ]]; then
  usage
  exit 1
fi
if ! [[ "$timeout_min" =~ ^[0-9]+$ ]]; then
  echo "poll.sh: --timeout must be an integer (minutes)" >&2
  exit 1
fi

if ! tmux has-session -t "$lane" 2>/dev/null; then
  [[ "$quiet" == false ]] && echo "[poll] no such tmux session: $lane" >&2
  exit 2
fi

emit() {
  # $1 = status line, $2 = last meaningful pane line
  [[ "$quiet" == false ]] && echo "$1"
  [[ "$report" == true ]] && echo "[poll:report] $2"
}

start_ts=$(date +%s)
timeout_s=$((timeout_min * 60))
sha_reached=false

while true; do
  pane="$(tmux capture-pane -t "$lane" -p 2>/dev/null)"
  last_line="$(printf '%s\n' "$pane" | grep -v '^[[:space:]]*$' | tail -1)"

  if printf '%s\n' "$pane" | grep -qE "$FAIL_RE"; then
    fail_line="$(printf '%s\n' "$pane" | grep -E "$FAIL_RE" | tail -1)"
    emit "[poll] FAIL detected on lane=$lane: $fail_line" "$last_line"
    exit 1
  fi

  if [[ -n "$until_sha" ]] && printf '%s\n' "$pane" | grep -qF "$until_sha"; then
    sha_reached=true
  fi

  idle_now=false
  if ! printf '%s\n' "$pane" | grep -qE "$BUSY_RE" && printf '%s\n' "$pane" | grep -qE "$IDLE_PROMPT_RE"; then
    idle_now=true
  fi

  success=false
  if [[ -n "$until_sha" && "$want_idle" == true ]]; then
    [[ "$sha_reached" == true && "$idle_now" == true ]] && success=true
  elif [[ -n "$until_sha" ]]; then
    [[ "$sha_reached" == true ]] && success=true
  else
    [[ "$idle_now" == true ]] && success=true
  fi

  if [[ "$success" == true ]]; then
    elapsed=$(( $(date +%s) - start_ts ))
    emit "[poll] lane=$lane reached target after ${elapsed}s" "$last_line"
    exit 0
  fi

  now=$(date +%s)
  if (( now - start_ts >= timeout_s )); then
    emit "[poll] TIMEOUT lane=$lane after ${timeout_min}m" "$last_line"
    exit 1
  fi

  sleep "$POLL_INTERVAL"
done
