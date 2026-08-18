# Objective: <sample — checks-only run against the current repo, no dispatch lane>

goal: prove run_loop.sh reaches [COMPLETE] with a passing check_cmd and no lane configured

acceptance: run_loop.sh exits 0 and emits exactly one [COMPLETE] line; no [BLOCKED], no dispatch

check_cmd: test -f AGENTS.md

artifacts: none

lane: 

from: 

until_commit: 

level: L0

max_rounds: 3

timeout_mins: 5

prompt: 
