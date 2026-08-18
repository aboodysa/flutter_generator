<!--
objective.md — template for the minimal objective-file contract run_loop.sh consumes generically.
Copy this file, fill in the fields, pass it as `run_loop.sh --objective <your-copy>.md`.

Format: plain `key: value` lines (one value per line, no YAML/JSON parser — shell-only per the
orchestrator tooling constraints). `#`-prefixed lines and blank lines are ignored. CLI flags on
run_loop.sh (--level/--lane/--from/--until-commit/--max-rounds/--timeout) override the matching
field below when both are given.
-->

# Objective: <short title>

goal: <one-line statement of what "done" means>

acceptance: <prose — the exact gate(s)/criteria a human would check to call this done>

check_cmd: npm run typecheck:builder && npx jest test/s1_visual_intent.test.ts

artifacts: none

lane: <tmux session name run_loop.sh dispatches the round prompt into; leave empty for a checks-only run against the current repo state, no dispatch>

from: <SHA the run starts from>

until_commit: <SHA that marks completion once check_cmd passes there; leave empty to complete the first round check_cmd passes>

level: L2

max_rounds: 10

timeout_mins: 10

prompt: <single-line prompt/command sent into the lane each round via `tmux send-keys`>
