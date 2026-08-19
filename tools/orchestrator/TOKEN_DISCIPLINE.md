# TOKEN_DISCIPLINE — improving efficiency while reducing tokens

> Operating guide (2026-08-19). Consolidates AGENTS.md "Context / token discipline" (rules 1–8),
> `tools/orchestrator/USAGE.md` §10 loop discipline, and the graphify-first rule. Binding for every
> local and remote agent loop.

## 1. Session lifecycle — the single biggest lever

- **One objective = one fresh session.** Pass objective/brief **file paths**, never conversation
  history. The disk is the memory; the session is disposable.
- **`/compact` when mid-slice and context grows** (e.g. claude shows `~NNNk uncached`). Condenses
  history, preserves the task, keeps working. Prefer over waiting for the reset screen.
- **`/clear` (local) or kill+fresh (remote) at every slice boundary.** When history no longer helps
  the next slice, start fresh. Never pay to re-read full history.
- **Remote tmux channels: kill and fresh, never prolong.** No cost-free reset quota. Kill the old
  opencode process + tmux session and launch a brand-new channel per task. Exceptions: a genuinely
  running mid-slice task (then `/compact` first, finish, kill+fresh next). Never let a remote session
  sit idle for hours with an old backlog.
- **Re-anchor after losing context:** point at AGENTS.md, `HANDOFF.md`, `CODE_CATALOGUE.md`, the
  relevant brief + contract, then the task. Commit first so a fresh session starts from a clean tree.

## 2. Keep the task alive on disk, not in context

- Before `/clear`/kill/new on any channel: commit the slice, note in `HANDOFF.md`/`CODE_CATALOGUE.md`
  what the next agent should re-anchor on.
- Every artifact (briefs, reports, RCAs, tests, goldens, harnesses) is saved under the project folder
  (`apps/<app>/`, `design/flutter-app-builder/`, `docs/qa/`). Never leave work in `/tmp` or a bare
  shell.

## 3. Orchestrator loop discipline (`run_loop.sh`)

- Drive via an `objective.md` file: `goal`, `acceptance`, `check_cmd`, `lane`, `prompt`. Pass the
  file path, not a pasted history.
- Verify with read-only `check_cmd` (typecheck, validate gates, flutter analyze/test, determinism
  diff) — the orchestrator verifies, it does not implement.
- Implementation → Claude first (remote opencode fallback); zen/orchestrator model reviews the
  returned diff + verifies.
- `[COMPLETE]` triggers stop → checkpoint/commit → next objective fresh.

## 4. Graphify-first for codebase structure (don't grep-slice)

- **Read the graph, don't grep-explore** for: SOLID/architecture audits, "where is X / what calls Y /
  how does Z flow" across `builder/src`, onboarding to an unfamiliar corner, dead-code/field-usage
  claims. Prefer `graphify query "<q>"` / `path A B` / `explain N` over multiple manual
  grep/Explore passes. One BFS traversal replaces dozens of greps and re-reads.
- **Keep the graph current.** Rebuild/`--update` only when `builder/src` structure changed — never
  just to answer a question. Check the `GRAPH_REPORT.md` header date vs recent commits.
- Cross-check graph edges against a direct code read for **field-level** claims (the graph is
  function/module-level, not field-level).
- Cost note: graphify on this repo is code-only → AST extraction, no LLM semantic pass, no token cost.

## 5. MCP servers add context weight — enable only what a slice needs

- MCP tool results stay in context for the whole session and add up fast (e.g. claude-in-chrome ~21%
  of usage). Per-slice: enable only the MCP servers the slice actually calls (browser/CDP for UI
  slices; Penpot for design; etc.); disable the rest for the run.

## 6. Watch the measured drivers (June 2026 audit)

- ~95% of usage came from sessions >150k context; ~92% from sessions active 8+ hours. Both are
  symptoms of "one giant session per project". The fix is rules 1–2, not designing around the quota.
- If a context meter is in the hundreds of k on a loop channel: `/compact` immediately, then plan a
  `/clear` at the next slice boundary.

## 7. Telegram / delivery

- Break long content into multiple `sendMessage` calls (one point per message) — never one huge
  message; the owner reads on a phone.
- Files (reports/markdown/IRs) go as `sendDocument` attachments, never text chunks.

## Checklist before dispatching any implementer

1. Lane is idle (`❯` prompt, no spinner) → kill+fresh it so it starts clean and cheap.
2. Brief written to disk (committed), prompt = a short file-pointer, no pasted history.
3. Re-anchor pointers (AGENTS.md, HANDOFF, brief) included in the brief.
4. Verification `check_cmd` decided (typecheck → validate → flutter analyze/test → determinism diff).
5. Owner already informed on Telegram (rule 11).
