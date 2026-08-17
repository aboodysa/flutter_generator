# HANDOFF — P4 COMPLETE, next: P5/D2 (round: 2026-08-17)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**P4 (capability-driven actions) — COMPLETE** (commits `a8629f6` + `d289f59`). **P3 —
COMPLETE** (`f0254f9`). **RCA-007 back-button — COMPLETE** (`ac3939d`). **S-CTX — COMPLETE.**
**P2 — CLOSED.** **SPIKE M4 — CLOSED.** Next per the frozen order (`SPIKE_PLAN.md`): **P5/D2**
(state-model-conditional Loading/Error/Empty triad).

## Model tier — implementer separation (owner directive + AGENTS.md, commit `a2b3c14`)

A **zen** model (this session: `opencode/deepseek-v4-flash`) is ORCHESTRATOR ONLY. It does not edit
`builder/src/**`, generated apps, or implementation files. It plans/scopes/verifies (read-only),
reviews diffs, writes decision/spike/research docs + QA harnesses (rule 12 location
`apps/<app>/output/qa/`), and delegates **implementation** to remote opencode agents on
tracematrix/tracematrix001 via tmux. Review + verify the returned diff as the orchestrator; never
be both orchestrator and keystroke-implementer. See the AGENTS.md section for the full contract.
**Note:** the P4 code below was authored before this rule landed; it already meets the contract.

## P4 — capability-driven actions, COMPLETE

Implements `INTERFACE_PATTERN_CONTRACT.md` §6 + `SPIKE_PLAN.md` §P4, per owner-accepted S-P4
MODIFY (4-layer: operations=capability · actionsFor=composition · screen=render · validate=agree).

- **`composition.ts`** — `ActionSpec {kind,label,icon,confirm?,presentation}` (kind
  `edit|export|delete|audit|save`, `params` dropped per round-2 edit #3) + **`actionsFor()`** (the
  SINGLE action decision; reads only existing `crudFormTargets`/`isAudited`/`resolveExport`; >2
  actions on a detail overflows non-edit into `presentation:overflow`).
- **`screen.ts`** — consumes `ctx.actions` by name (never re-derives/counts); Delete always
  confirm-guarded (`showDialog`, Cancel = no mutation); Audit → `/audit-log` on audited details;
  overflow = ONE `PopupMenuButton` dispatching by kind; export via existing exportButtons; save is
  semantic-only (no FAB).
- **`infra.ts`** — locale vocabulary += `cancel`, `audit` (P4 labels localizeable, L4 fixed chrome).
- **`test.ts`** — crud flow test taps the confirm dialog; opens overflow menu when actionsFor
  decided Delete is overflowed (consumes `actionsTargets`, never re-derives).
- **`validate.ts`** — `[actions]` gate: re-derives via same `actionsTargets`, diffs plan.json
  `patterns.actions`, scans every screen (positive set renders, null set absent, Delete
  confirm-guarded, no Save FAB, closed vocabulary).

**Verified** (all green): typecheck; 13/13 IRs validate; analyze 0 errors on all 4 apps; tests
pass; `[actions]` negative controls FAIL as required (stale plan, delete-without-confirm,
save-FAB); null-set byte-identical (wizard/reimbursement unchanged); CDP on hr_service — overflow
menu = Delete + Audit (Edit inline), delete Cancel=no-op / Confirm=deletes+returns to list,
audit-nav proven by widget test (`apps/hr_service/output/qa/p4-audit-nav_test.dart` — Flutter
drives PopupMenuButton deterministically vs CDP's stale web menu geometry), no overflow 320-1280.
Screenshots under `apps/hr_service/output/qa/p4-actions/`.

## Roadmap note (owner 2026-08-17)

**TOOL-1 — OpenCode Zen context compression/persistence** recorded in SPIKE_PLAN.md "Not-scheduled
register" as ⏸ **roadmap only, NOT now** (owner call). Requirements captured: baseline before +
benchmark after (input/total tokens, cost, latency, success, context-loss); deterministic first
(dedupe, compress tool output, files-as-durable-memory, compact session state, archive + budget);
LLM summarize only when deterministic insufficient (cheap model); provider-agnostic; tests. Needs
OpenCode source clone (`github.com/sst/opencode`, installed `/opt/homebrew/Cellar/opencode/1.18.13`,
SQLite store `/Users/username/Documents/cto/opencode.db`). Do NOT start without owner go.

## Ground truth (roadmap), updated

| Area | State |
|---|---|
| P1 (shell) | ✅ shipped `4e91e50` |
| P2 (search) | ✅ CLOSED `99da57b`/`dafe4b1`/`f48e5a6` |
| SPIKE M4 | ✅ CLOSED (MODIFY `b5eb50c`, M4a applied; M4b deferred) |
| S-CTX (plan determinism) | ✅ COMPLETE `5a67f5f` |
| P3 (scroll) | ✅ COMPLETE `f0254f9` + brief `175807a` |
| RCA-007 (back button) | ✅ COMPLETE `ac3939d`/`ecfac84` |
| **P4 (actions)** | ✅ **COMPLETE this round** `a8629f6`/`d289f59` |
| P5/D2 placement | **Next** (state-model-conditional triad) |
| S-HERMETIC, S-DEEPLINK | Backlog / owner call |
| **TOOL-1 OpenCode compression** | ⏸ roadmap only, NOT now |

## Verification commands
```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node --transpile-only builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter pub get && flutter analyze && flutter test
# P4 negative-control harness (temp) — delete-strip + save-FAB
npx ts-node --transpile-only <qa harness>  # see CODE_CATALOGUE; pattern proven in /tmp scripts
```

## Next steps (not started, for whoever picks this up)

1. **P5/D2** — single placement owner for the Loading/Error/Empty triad, **state-model-conditional**
   (ChatGPT round-2 edit #4): each screen renders exactly the triad members its own state model
   declares; `[states]` validator checks per-applicable-contract, not a universal three-part
   requirement. Same selector+plan.json+gate loop as P2/P3/P4.
2. **`[nav]` validate gate** (RCA-007 prevention) — form submits use pushReplacement/pop, never
   bare `go` to a detail path; matches [actions]/[scroll]/[search] posture.
3. **S-HERMETIC**, **S-DEEPLINK** — independent/backlog, see SPIKE_PLAN.md.
4. **M4b**, SwiftUI S3+ — deferred by design; resume per owner directive.
5. **TOOL-1 (OpenCode compression)** — roadmap only; do NOT start without owner go (see note).

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat via stash+regen+diff; **zen model = orchestrator, delegate implementation to remote
opencode agents** (AGENTS.md "Model tier"); spikes follow SPIKE_PROTOCOL (read-only, decide first);
report to owner on Telegram; keep HANDOFF lean (archive previous to context_history with dated
header).
