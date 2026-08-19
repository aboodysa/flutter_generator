# Orchestrator — usage guide (flutter_generator)

> Objective-driven autonomous agent orchestration for THIS repo. Companion to the portable
> `tools/orchestrator-kit/USAGE.md` (project-agnostic copy); this file is the live, in-repo
> operator reference with concrete flutter_generator commands. For token efficiency read
> `TOKEN_DISCIPLINE.md` (session lifecycle, compact/clear, graphify-first, MCP weight).

---

## 1. What it is

A shell-only toolbox that runs **objective-driven autonomous agent loops**: you point it at a
small objective file, it dispatches the work to an agent lane (Claude Code locally, or remote
opencode over tmux), polls until the agent is done, verifies against your own `check_cmd`,
reports progress at a configured verbosity, and stops on `[COMPLETE]` — or on exactly one
`[BLOCKED]` line when a human is genuinely required. It never asks "should I continue?".

Two hard design rules:

1. **Reporting is a pure observer.** Changing `ORCH_PROGRESS_LEVEL` changes *output*, never
   *behavior*.
2. **The 8 scripts are single-purpose helpers** built to suppress routine command narration —
   they print only on meaningful events (milestones, decisions, verify results, retries,
   blockers, completion).

Only `tmux` and `git` are required for the loop. `curl` (Telegram), a Chrome-for-Testing build
(PDF), and ImageMagick (contact sheets) are optional, used only by their respective adapters.

---

## 2. Layout

```
tools/orchestrator/
  run_loop.sh              the objective loop: guard -> dispatch -> poll -> verify -> COMPLETE
  report.sh                reporting library (L0-L3 levels, 6 tags, auto-escalate/recover)
  poll.sh                  tmux-pane poller (--until <sha> / --idle / --timeout)
  objective.md             template + the current/example objective file (copy per slice)
  tgsend.sh                Telegram text/doc/photo (token file + chat id, see AGENTS rule 10)
  dispatch_kill_fresh.sh   remote tmux channel: kill stale session -> fresh -> launch opencode
  genapp.sh                approve -> generate -> validate command chain for a generated app
  capture_golden.sh        one-off Flutter golden-test capture harness (390x844, real Roboto)
  pdf_build.sh             Chrome-headless HTML->PDF + ImageMagick PNG contact sheet
```

All scripts are self-documenting via `-h`/`--help` and have a usage block in the header.

---

## 3. The core loop (`run_loop.sh`)

```bash
tools/orchestrator/run_loop.sh --objective <file.md> [--level L2] [--lane <tmux-session>]
    [--from <SHA>] [--until-commit <SHA>] [--max-rounds N] [--timeout <mins>] [--repo <dir>]
```

| Flag | Default | What it does |
|---|---|---|
| `--objective <file>` | required | the objective file (see §4) |
| `--level Ln` | objective's `level` field, else `L2` | reporting verbosity |
| `--lane <tmux>` | objective's `lane` field | tmux session to dispatch the prompt into; empty = checks-only run |
| `--from <SHA>` | objective's `from`, else current HEAD | starting commit for round tracking |
| `--until-commit <SHA>` | objective's `until_commit` | complete only once `check_cmd` passes at this commit |
| `--max-rounds N` | objective's `max_rounds`, else `10` | hard stop (becomes `[BLOCKED]`) |
| `--timeout <mins>` | objective's `timeout_mins`, else `10` | max minutes to wait for the lane to go idle per round |
| `--repo <dir>` | git root of cwd | which git repo to verify against |

CLI flags override the objective-file field when both are given. Only `check_cmd` is mandatory.

### Round protocol (per round `n`, up to `max_rounds`)

1. **Guard** — if `--until-commit` already equals HEAD, emit `[COMPLETE] objective already
   satisfied` and exit 0 before doing anything.
2. **Dispatch** — if a `lane` is configured, `tmux send-keys` the objective's `prompt` into it;
   a missing/dead lane is an immediate `[BLOCKED]`. No lane = verification-only run.
3. **Poll** — `poll.sh --lane --idle` with the round timeout. Timeouts escalate to L3 and retry
   with backoff (up to 10s per round).
4. **Verify** — run `check_cmd` inside `--repo`.
   - PASS: `[VERIFY]`, recover verbosity if it was escalated, update `current_head`.
   - FAIL: escalate to L3 (`[RECOVERY] … escalating`), print the last log line, backoff, retry.
5. **Complete** — if `--until-commit` is set, only finish when `check_cmd` passes at that HEAD;
   otherwise finish as soon as `check_cmd` passes.

The loop halts on exactly two conditions: `[COMPLETE]` or one `[BLOCKED]`. No "should I
continue?" prompts.

---

## 4. Objective-file format

Plain `key: value` lines (one value per line; shell-greppable, no YAML/JSON). `#` lines and blank
lines are ignored. Only `check_cmd` is required.

| Field | Required | Meaning |
|---|---|---|
| `goal` | no | one-line statement of what "done" means |
| `acceptance` | no | the exact gate(s) a human would check to call this done |
| `check_cmd` | **yes** | command proving the objective is met; run inside `--repo` each round |
| `artifacts` | no | evidence/artifacts the objective is expected to produce |
| `lane` | no | tmux session to dispatch into; empty = checks-only, no dispatch |
| `from` | no | SHA the run starts from |
| `until_commit` | no | SHA marking completion once `check_cmd` passes there |
| `level` | no | reporting level (`L0`–`L3`), default `L2` |
| `max_rounds` | no | max rounds before `[BLOCKED]`, default `10` |
| `timeout_mins` | no | lane-idle wait per round, default `10` |
| `prompt` | no | single-line prompt/command sent into the lane each round via `tmux send-keys` |

A working template lives in `objective.md`. Copy it per slice and fill the fields; keep objective
files small (one logical slice per objective).

---

## 5. Progress levels & message tags

`ORCH_PROGRESS_LEVEL` (env, default `L2`) is read fresh on every call.

| Level | Reports | Use |
|---|---|---|
| **L0** | completion (`[COMPLETE]`) + blockers (`[BLOCKED]`) only | batch/cron |
| **L1** | L0 + major milestones, retries | short runs |
| **L2** (default) | L1 + important decisions, findings, verification results | normal |
| **L3** | L2 + detailed execution/tool activity | debugging |

- **Auto-escalation:** any failure path forces L3 automatically; a clean recovery returns to the
  configured level. Escalation is never manual.
- Every emitted line starts with one of six tags so a transcript can be grepped/split by category:

  `[PROGRESS]` milestone · `[DECISION]` a decision taken · `[VERIFY]` a verification result ·
  `[RECOVERY]` retry/backoff/escalation-then-recovery · `[BLOCKED]` human input required (stops) ·
  `[COMPLETE]` objective met.

---

## 6. The helpers (what each one is for)

### `poll.sh` — wait for an agent lane

```bash
poll.sh --lane <tmux-session> [--until <sha>] [--idle] [--timeout <mins>] [--quiet] [--report]
```

| Flag | Behavior |
|---|---|
| `--lane <session>` (required) | tmux session to poll |
| `--until <sha>` | success once `<sha>` appears in the pane's visible text |
| `--idle` | success once the pane shows an idle `❯` prompt (no busy spinner) |
| `--timeout <m>` | minutes before giving up (default 10) |
| `--quiet` | suppress the status line (exit code only) |
| `--report` | also print the last meaningful pane line |

Exit codes: `0` success · `1` timeout or a visible `FAIL`/`Error:`/`Exception` line · `2` bad or
missing tmux session.

**Idle detection caveat:** a bare `❯` is *not* reliable — busy Claude Code panes keep `❯` plus a
`thought for Ns)` spinner, so idle = `❯` visible AND no spinner. Remote opencode panes may render
differently; if idle never triggers there, use `--until <sha>` instead or update the regex in the
script header.

### `tgsend.sh` — Telegram (AGENTS rule 10)

```bash
tgsend.sh text  "message"          # one point/paragraph per message
tgsend.sh doc   <file> ["caption"] # sendDocument — PREFERRED for files/reports
tgsend.sh photo <file> ["caption"] # sendPhoto — screenshots/goldens
```

Reads the bot token from `~/.mac_companion/token`, chat `1117739189`. Prints nothing on success,
an error + non-zero exit on failure. Never send a whole report as text chunks — send it as a
`doc` attachment.

### `dispatch_kill_fresh.sh` — remote opencode channel (AGENTS context-discipline rule 4)

```bash
dispatch_kill_fresh.sh --host <tracematrix|tracematrix001> --channel <name> --workdir <path> \
    [--primed] --yes
```

Kills the existing remote tmux session, starts a fresh detached session in `<workdir>`, launches
opencode, dismisses a first-launch welcome overlay, and waits for a ready prompt. It does **not**
send the task prompt — `run_loop.sh` (or you) sends that separately. **Destructive**, so it
refuses to run without `--yes` (without it, dry-runs). Use this for every new task — a fresh
channel is cheap and carries no polluted context.

### `genapp.sh` — approve → generate → validate triple

```bash
genapp.sh <ir-file> <out-dir>
```

Runs `approve.ts` → `index.ts` → `validate.ts` on a generated app, one line per stage, exits
non-zero on the first failure. The standard regeneration entry point.

### `capture_golden.sh` — one-off golden capture

```bash
capture_golden.sh --app <out/app> --pkg <rasheed_replica_X> --screen <ScreenClass> \
    --cubit <CubitClass> --route </r> [--auth]
```

Writes `test/cap_test.dart` from a known-good template and runs
`flutter test test/cap_test.dart --update-goldens` inside the app. Uses real Roboto via
`FontLoader` + `buildTheme()` (never bare `MaterialApp`). `--auth` pumps the real `ReplicaApp` +
signs in + pushes the route for auth-gated/child screens. Outputs `goldens/cap_<screen>.png`.

### `pdf_build.sh` — HTML→PDF and PNG contact sheet

```bash
pdf_build.sh <in.html> <out.pdf>
pdf_build.sh --contact <dir-of-pngs|comma-list> <out.png>
```

Chrome-headless HTML→PDF, or an ImageMagick `montage` contact sheet (labeled tiles) — useful for
shipping evidence to the owner.

---

## 7. Worked example (realistic for this repo)

Objective `objectives/s6-slice5.md` for a "write the A11y test generator" slice:

```text
goal: land the A11y test generator slice (regression suite green)
acceptance: typecheck clean, jest green, validate.ts VALIDATION PASSED on all samples
check_cmd: npm run typecheck:builder && npx jest test/s1_visual_intent.test.ts && git status --porcelain | grep -q ''
artifacts: commit SHA + test/s1_visual_intent.test.ts additions
lane: s-hermetic
from: c848640
until_commit: f030dd4
level: L2
max_rounds: 8
timeout_mins: 15
prompt: read design/flutter-app-builder/research/S6_IMPL_BRIEF_CLAUDE.md, implement slices 1-4, push
```

Run:

```bash
tools/orchestrator/run_loop.sh --objective objectives/s6-slice5.md
```

At L2 you see `[PROGRESS]` round starts, `[VERIFY]` pass/fail per round, `[RECOVERY]` on any
failure with auto-escalation, `[COMPLETE] objective met at f030dd4` when the until-commit lands
green. If the lane dies or rounds run out: exactly one `[BLOCKED]`, then it stops.

A checks-only run (no lane, no agent) reuses the same loop to watch any external process reach a
commit — e.g. after you commit the nosql persistence fix, a checks-only objective whose
`check_cmd` is `npx ts-node --transpile-only builder/src/validate.ts apps/kids_quiz/input/kids_quiz.ir.json apps/kids_quiz/output/app` proves green and stops.

---

## 8. Verification (prove the toolkit works)

1. **Level gating** — run the same objective at `--level L0` and `--level L3`; outcomes identical,
   output radically different (L0 ≈ 2-4 lines, L3 verbose).
2. **Auto-escalate/recover** — make one `check_cmd` fail; observe `[RECOVERY]` at verbose level,
   then a clean success returns to the configured level.
3. **Tags** — every emitted line begins with one of the six tags; grep the transcript for the tag
   histogram.
4. **Autonomy** — a generated transcript contains no "should I / continue? / permission?" prompts;
   it runs to `[COMPLETE]` (or one `[BLOCKED]`) unaided.
5. **Gates intact** — your project's own checks still pass (run_loop never mutates the repo; it
   only reads git and runs your `check_cmd`).

Quick sanity:

```bash
bash -n tools/orchestrator/*.sh                      # no syntax errors
tools/orchestrator/run_loop.sh --help                # usage prints
source tools/orchestrator/report.sh; report 0 "[TEST]" "hello"   # prints at any level
```

---

## 9. Troubleshooting

| Symptom | Cause / fix |
|---|---|
| `lane '<name>' has no live tmux session` → `[BLOCKED]` | the lane isn't running. Start it (`dispatch_kill_fresh.sh --host … --yes` for remote, or attach locally) and re-run |
| Lane never goes idle → timeouts, escalating | `poll.sh` idle detection is tuned for Claude Code TUI panes; remote opencode may need a `--until <sha>` target or a lane-specific idle regex (see `poll.sh` header) |
| `[BLOCKED] objective not met after N round(s)` | `max_rounds` exhausted. Increase it, fix the lane, or split the objective |
| `--repo is not a git repo` | `--repo` must point at a git repo (or a dir whose git root is discoverable); defaults to cwd's git root |
| check_cmd keeps failing | read the last log line printed with the `[RECOVERY]` message; fix the objective/project, not the toolkit |
| tgsend fails with HTTP ≠ 200 | token file missing (`~/.mac_companion/token`), wrong chat id, or the bot can't reach the chat |

---

## 10. Loop discipline (how to keep looping without burning context)

- One objective = one fresh session. Pass objective file paths, never conversation history.
- Repository artifacts (briefs, reports, tests, `HANDOFF.md`) are the durable state; the session is
  disposable.
- Between independent objectives: `/clear` (local) or kill+fresh the remote channel
  (`dispatch_kill_fresh.sh --yes`), then re-anchor on the objective file.
- Mid-slice with growing context: `/compact`, keep working.
- `[COMPLETE]` is the trigger to stop, checkpoint/commit, and start the next objective fresh.
- The orchestrator is an *orchestrator* — it runs the loop and verifies, it does not implement.
  Implementation goes to Claude first (remote opencode fallback), and the zen/orchestrator model
  reviews the returned diff and verifies (see AGENTS.md "Model tier — implementer separation").
