#!/usr/bin/env bash
# report.sh — pure reporting library for tools/orchestrator/. Source it; don't run it as the
# main program. report() only ever prints or stays silent — it never returns a status the caller
# branches execution on, so flipping ORCH_PROGRESS_LEVEL cannot change what a run *does*, only
# what it *says*.
#
# Levels (numeric, so one message can target several): L0=0 < L1=1 < L2=2 < L3=3.
#   L0 completion + blockers only        (batch/cron)
#   L1 L0 + major milestones, retries    (short runs)
#   L2 L1 + decisions, findings, verify  (default)
#   L3 L2 + detailed execution/tool activity (debugging)
#
# Usage:
#   source "$(dirname "${BASH_SOURCE[0]}")/report.sh"
#   report [--always] <level_needed 0-3> <TAG> <msg...>   # prints iff effective level >= level_needed
#   report_escalate <TAG> <msg...>                         # always prints; forces effective level to L3
#   report_recover  <TAG> <msg...>                         # always prints; returns effective level to configured
#   report_is_escalated                                    # exit 0 if currently escalated (debug mode)
#
# Tags — first token of every emitted line, so a transcript can be grepped/split by category:
#   [PROGRESS] [DECISION] [VERIFY] [RECOVERY] [BLOCKED] [COMPLETE]
#
# ORCH_PROGRESS_LEVEL (env, default L2) is read fresh on every call, so a change takes effect
# mid-run. report_escalate/report_recover always print unconditionally: their entire purpose is
# guaranteeing failure-path visibility even under a quiet configured level (e.g. L0 batch/cron) —
# gating them on the configured level would defeat auto-escalation.

: "${ORCH_PROGRESS_LEVEL:=L2}"

_ORCH_DEBUG_MODE=0 # 1 while escalated; set by report_escalate, cleared by report_recover

_orch_level_num() {
  case "$1" in
    L0|0) echo 0 ;;
    L1|1) echo 1 ;;
    L2|2) echo 2 ;;
    L3|3) echo 3 ;;
    *) echo 2 ;; # unknown -> default L2
  esac
}

_orch_effective_level() {
  if [[ "$_ORCH_DEBUG_MODE" == "1" ]]; then
    echo 3
  else
    _orch_level_num "${ORCH_PROGRESS_LEVEL}"
  fi
}

report() {
  local always=false
  if [[ "${1:-}" == "--always" ]]; then
    always=true
    shift
  fi
  local level_needed="${1:-2}"; shift || true
  local tag="${1:-[PROGRESS]}"; shift || true
  local msg="$*"

  if [[ "$always" == true ]]; then
    echo "${tag} ${msg}"
    return 0
  fi

  local eff
  eff="$(_orch_effective_level)"
  if (( eff >= level_needed )); then
    echo "${tag} ${msg}"
  fi
}

report_escalate() {
  local tag="${1:-[RECOVERY]}"; shift || true
  local msg="$*"
  _ORCH_DEBUG_MODE=1
  echo "${tag} ${msg}"
}

report_recover() {
  local tag="${1:-[RECOVERY]}"; shift || true
  local msg="$*"
  echo "${tag} ${msg}"
  _ORCH_DEBUG_MODE=0
}

report_is_escalated() {
  [[ "$_ORCH_DEBUG_MODE" == "1" ]]
}

# Direct execution (not sourced): print usage and exit clean rather than doing nothing silently.
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
  cat >&2 <<'EOF'
report.sh is a library — source it, don't run it:
  source "$(dirname "$0")/report.sh"
  report [--always] <level_needed 0-3> <TAG> <msg...>
  report_escalate <TAG> <msg...>
  report_recover  <TAG> <msg...>
  report_is_escalated
EOF
  exit 0
fi
