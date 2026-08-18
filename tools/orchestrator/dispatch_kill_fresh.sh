#!/usr/bin/env bash
# dispatch_kill_fresh.sh — remote opencode "kill stale session, fresh session, launch" sequence
# for the owner's tracematrix/tracematrix001 VPS hosts (see AGENTS.md "Remote opencode hosts").
# Usage:
#   dispatch_kill_fresh.sh --host <tracematrix|tracematrix001> --channel <name> --workdir <path> \
#     [--primed] --yes
# Leaves the channel launched and idle at its opencode prompt; the caller sends the actual task
# prompt separately with `tmux send-keys -t <channel> '...' Enter` (this script does not send it).
# DESTRUCTIVE (kills an existing tmux session on the remote host) — refuses without --yes.
set -uo pipefail

usage() {
  cat >&2 <<'EOF'
usage: dispatch_kill_fresh.sh --host <tracematrix|tracematrix001> --channel <name> \
         --workdir <path> [--primed] --yes
  --yes is required to actually run (kills the existing remote tmux session). Without it, this
  prints the planned actions and exits without touching the remote host.
EOF
}

host=""
channel=""
workdir=""
primed=false
confirmed=false

if [[ $# -eq 0 ]]; then
  usage
  exit 1
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) host="${2:-}"; shift 2 ;;
    --channel) channel="${2:-}"; shift 2 ;;
    --workdir) workdir="${2:-}"; shift 2 ;;
    --primed) primed=true; shift ;;
    --yes) confirmed=true; shift ;;
    -h|--help) usage; exit 0 ;;
    *) usage; exit 1 ;;
  esac
done

case "$host" in
  tracematrix)
    ssh_target="root@tracematrix.businessanalystcrew.org"
    opencode_bin="/usr/local/bin/opencode"
    ;;
  tracematrix001)
    ssh_target="root@tracematrix001.businessanalystcrew.org"
    opencode_bin="/root/.opencode/bin/opencode"
    ;;
  "")
    usage
    exit 1
    ;;
  *)
    echo "dispatch_kill_fresh.sh: unknown --host '$host' (known: tracematrix, tracematrix001)" >&2
    exit 1
    ;;
esac

if [[ -z "$channel" || -z "$workdir" ]]; then
  usage
  exit 1
fi

plan="[dispatch_kill_fresh] host=$host ($ssh_target) channel=$channel workdir=$workdir primed=$primed
  1. ssh: tmux kill-session -t '$channel' (ignore if absent)
  2. ssh: tmux new-session -d -s '$channel' -c '$workdir'
  3. ssh: tmux send-keys -t '$channel' '$opencode_bin' Enter
  4. poll capture-pane; dismiss a first-launch welcome overlay if seen; wait for a ready prompt"

if [[ "$confirmed" == false ]]; then
  echo "[dispatch_kill_fresh] DRY RUN (pass --yes to execute):"
  echo "$plan"
  exit 1
fi

echo "$plan"

ssh "$ssh_target" "tmux kill-session -t '$channel' 2>/dev/null; tmux new-session -d -s '$channel' -c '$workdir'; tmux send-keys -t '$channel' '$opencode_bin' Enter"

# opencode's first launch in a fresh session can show a one-time welcome/onboarding overlay that
# blocks the prompt until dismissed. Poll a few times; if the pane doesn't yet look like a ready
# opencode prompt, send Enter (dismisses "press enter to continue"-style overlays) and recheck.
ready=false
for _ in 1 2 3 4 5 6; do
  sleep 2
  pane="$(ssh "$ssh_target" "tmux capture-pane -t '$channel' -p" 2>/dev/null)"
  if printf '%s\n' "$pane" | grep -qiE 'welcome|get started|press (any key|enter)|onboarding'; then
    ssh "$ssh_target" "tmux send-keys -t '$channel' Enter" 2>/dev/null
    continue
  fi
  if [[ -n "$pane" ]]; then
    ready=true
    break
  fi
done

if [[ "$ready" == true ]]; then
  echo "[dispatch_kill_fresh] channel '$channel' launched on $host, ready for a primed prompt"
  exit 0
else
  echo "[dispatch_kill_fresh] channel '$channel' launched on $host but pane did not settle — verify manually" >&2
  exit 1
fi
