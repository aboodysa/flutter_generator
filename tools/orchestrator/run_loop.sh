#!/usr/bin/env bash
# run_loop.sh — objective-driven autonomous execution harness. Reads an objective.md-shaped file
# (see objective.md template), loops dispatch -> poll -> verify against a tmux lane until the
# objective is met, and reports progress via report.sh. Execution logic lives here; verbosity
# lives in report.sh — changing ORCH_PROGRESS_LEVEL must never change what this script *does*.
#
# Usage:
#   run_loop.sh --objective <file.md> [--level L2] [--lane <tmux-session>] [--from <SHA>]
#               [--until-commit <SHA>] [--max-rounds N] [--timeout <mins>] [--repo <dir>]
#
# Per round: guard (objective already satisfied?) -> dispatch prompt to --lane (skipped if no
# lane configured) -> poll.sh --idle -> run check_cmd -> [VERIFY]. On failure: report_escalate
# (forces verbose reporting) + backoff + retry. On success after an escalation: report_recover.
# Reaching --until-commit (or check_cmd passing with no --until-commit set) -> [COMPLETE].
# Exhausting --max-rounds, or a missing/dead --lane, -> exactly one [BLOCKED] and stop — the only
# things allowed to halt this loop. No "should I continue?" prompts anywhere in this script.
set -uo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
# shellcheck source=./report.sh
source "$SCRIPT_DIR/report.sh"

usage() {
  cat >&2 <<'EOF'
usage: run_loop.sh --objective <file.md> [--level L2] [--lane <tmux-session>] [--from <SHA>]
                    [--until-commit <SHA>] [--max-rounds N] [--timeout <mins>] [--repo <dir>]
EOF
}

objective_file=""
opt_level=""
opt_lane=""
opt_from=""
opt_until=""
opt_max_rounds=""
opt_timeout=""
opt_repo=""

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --objective) objective_file="${2:-}"; shift 2 ;;
    --level) opt_level="${2:-}"; shift 2 ;;
    --lane) opt_lane="${2:-}"; shift 2 ;;
    --from) opt_from="${2:-}"; shift 2 ;;
    --until-commit) opt_until="${2:-}"; shift 2 ;;
    --max-rounds) opt_max_rounds="${2:-}"; shift 2 ;;
    --timeout) opt_timeout="${2:-}"; shift 2 ;;
    --repo) opt_repo="${2:-}"; shift 2 ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done

if [[ -z "$objective_file" || ! -f "$objective_file" ]]; then
  echo "run_loop.sh: --objective file not found: $objective_file" >&2
  usage
  exit 1
fi

get_field() {
  # get_field <key> <file> — first non-comment "<key>: <value>" line, trimmed.
  grep -E "^${1}:" "$2" | head -1 | sed -E "s/^${1}:[[:space:]]*//"
}

goal="$(get_field goal "$objective_file")"
check_cmd="$(get_field check_cmd "$objective_file")"
lane="${opt_lane:-$(get_field lane "$objective_file")}"
from_sha="${opt_from:-$(get_field from "$objective_file")}"
until_commit="${opt_until:-$(get_field until_commit "$objective_file")}"
level="${opt_level:-$(get_field level "$objective_file")}"
max_rounds="${opt_max_rounds:-$(get_field max_rounds "$objective_file")}"
timeout_mins="${opt_timeout:-$(get_field timeout_mins "$objective_file")}"
prompt="$(get_field prompt "$objective_file")"
repo="${opt_repo:-$REPO_ROOT}"

: "${level:=L2}"
: "${max_rounds:=10}"
: "${timeout_mins:=10}"

if [[ -z "$check_cmd" ]]; then
  echo "run_loop.sh: objective file has no check_cmd: $objective_file" >&2
  exit 1
fi
if [[ ! -d "$repo/.git" ]]; then
  echo "run_loop.sh: --repo is not a git repo: $repo" >&2
  exit 1
fi

export ORCH_PROGRESS_LEVEL="$level"

report 3 "[PROGRESS]" "objective='$objective_file' goal='$goal' lane='${lane:-<none>}' repo=$repo level=$level max_rounds=$max_rounds"

# Guard: objective already satisfied before doing any work.
if [[ -n "$until_commit" ]]; then
  head_now="$(git -C "$repo" rev-parse HEAD)"
  if [[ "$head_now" == "$until_commit"* ]]; then
    report --always 0 "[COMPLETE]" "objective already satisfied at $head_now: $goal"
    exit 0
  fi
fi

backoff_for() {
  local round="$1"
  local b=$(( round * 2 ))
  (( b > 10 )) && b=10
  echo "$b"
}

round=0
current_head="${from_sha:-$(git -C "$repo" rev-parse HEAD)}"

while true; do
  round=$((round + 1))

  if (( round > max_rounds )); then
    report --always 0 "[BLOCKED]" "objective not met after $max_rounds round(s) (max-rounds reached) — awaiting human input"
    exit 1
  fi

  report 1 "[PROGRESS]" "round $round: starting (lane=${lane:-<none>})"

  if [[ -n "$lane" ]]; then
    if ! tmux has-session -t "$lane" 2>/dev/null; then
      report --always 0 "[BLOCKED]" "lane '$lane' has no live tmux session — awaiting human input"
      exit 1
    fi
    report 3 "[PROGRESS]" "round $round: dispatching prompt to lane=$lane"
    tmux send-keys -t "$lane" "$prompt" Enter

    if ! "$SCRIPT_DIR/poll.sh" --lane "$lane" --idle --timeout "$timeout_mins" --quiet; then
      if report_is_escalated; then
        report 3 "[RECOVERY]" "round $round: lane still not idle after ${timeout_mins}m — retrying"
      else
        report_escalate "[RECOVERY]" "round $round: lane did not go idle within ${timeout_mins}m — escalating and retrying"
      fi
      sleep "$(backoff_for "$round")"
      continue
    fi
  fi

  new_head="$(git -C "$repo" rev-parse HEAD)"
  if [[ "$new_head" != "$current_head" ]]; then
    report 1 "[PROGRESS]" "round $round: new commit $new_head"
  else
    report 3 "[PROGRESS]" "round $round: no new commit (HEAD unchanged at $new_head)"
  fi

  report 3 "[VERIFY]" "round $round: running check_cmd: $check_cmd"
  if ( cd "$repo" && eval "$check_cmd" ) >/tmp/run_loop_check.$$.log 2>&1; then
    report 2 "[VERIFY]" "round $round: PASS — $check_cmd"
    if report_is_escalated; then
      report_recover "[RECOVERY]" "round $round: recovered — checks green"
    fi
    current_head="$new_head"
    rm -f "/tmp/run_loop_check.$$.log"
  else
    tail_line="$(tail -n1 "/tmp/run_loop_check.$$.log" 2>/dev/null)"
    rm -f "/tmp/run_loop_check.$$.log"
    if report_is_escalated; then
      report 3 "[VERIFY]" "round $round: FAIL — $check_cmd :: $tail_line"
    else
      report_escalate "[RECOVERY]" "round $round: check_cmd FAILED — escalating: $tail_line"
    fi
    sleep "$(backoff_for "$round")"
    continue
  fi

  if [[ -n "$until_commit" ]]; then
    if [[ "$new_head" == "$until_commit"* ]]; then
      report --always 0 "[COMPLETE]" "objective met at $new_head after $round round(s): $goal"
      exit 0
    fi
    report 2 "[DECISION]" "round $round: checks green but HEAD ($new_head) != until_commit ($until_commit) — continuing"
  else
    report --always 0 "[COMPLETE]" "objective met after $round round(s): $goal"
    exit 0
  fi
done
