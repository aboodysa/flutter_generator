# P1 Implementation Brief — Global navigation shell (NavigationBar)

Status: **queued to claude (claude-flutter-grill)** 2026-08-17.
Contract: `research/INTERFACE_PATTERN_CONTRACT.md` §3 (P1) + §9 guardrails — owner-reviewed,
implementation-ready. Research context: `research/MOBILE_UI_PATTERNS.md`. Predecessor: main
capability loop declared COMPLETE (HANDOFF.md).

---

## 1. What P1 is

For **multi-feature apps** (`ir.features.length > 1`), emit a global bottom `NavigationBar`
shell so the user can switch top-level features in-app. Today multi-feature apps (ledgerly) are
flat parallel GoRouter roots with **no way to switch features** — the LM6/LM7 class of
"unreachable screens" gap. P1 gives the generated app a real app shell.

Per the contract's **master principle**: pattern selection is centralized and deterministic —
the shell is NOT an if-statement inside `screen.ts`. The composition layer decides; generators
consume a decided payload.

## 2. Exact changes (each must land; follow the contract §3)

### 2.1 Destination contract (contract §3.1) — the source of truth

Each shell destination derives deterministically from one top-level feature:

| Slot | Derivation |
|---|---|
| stable feature id | `ir.features[i].id` (or `name` — use whichever is stable; document it) |
| display title | the feature's primary list entity's `title`/`name`/`label` field, humanized (reuse existing humanize/`fileName`/`kebab` helpers from `naming.ts`/`dart.ts`) |
| primary/root screen | the feature's first list screen — i.e. its root route (the path `screenPath()`/route.ts already emits for that screen) |
| deterministic icon | a **fixed stem map** from feature-id prefix → Material icon (e.g. `expense→Icons.receipt_long`, `approval→Icons.approval`, `budget→Icons.account_balance_wallet`, `auth→Icons.person`, `task→Icons.checklist`, fallback `Icons.widgets`). Additive, additive-only; no LLM, no inference. |

- **`features[]` order ⇒ shell destination order.** No alphabetical sorting, no inferred
  ordering, no LLM selection. IR order is authoritative.
- **Per-destination navigation state:** use `StatefulShellRoute.indexedStack` (go_router)
  wrapping the feature route branches so each tab keeps its own stack/scroll/search state.

### 2.2 Pattern selection (contract §1, §3) — composition layer owns the decision

- Add a `patterns` block to the composition/plan surface: e.g. `composition.ts` gains a
  `shellFor(features): ShellPattern | null` selector — returns a typed destination list when
  `features.length > 1` (only then a shell exists), else `null` (single-feature apps unchanged,
  byte-identical).
- The selector reads IR (features, screens, entities) + existing `operations.ts` helpers only.
  **Do not add any presentation logic to `screen.ts`/`route.ts`** — they consume the decided
  destination list.
- Record the decision in `plan.json` (`patterns.shell`) so the plan documents what was chosen —
  same pattern the strategy-fidelity gate uses (`validate.ts` reads `plan.json`).

### 2.3 Destination-count rule (contract §3.2 — CRITICAL CORRECTION)

- `features.length <= 5` → emit `NavigationBar`.
- `features.length > 5` → **generation-time planning error**, deterministic, explicit:
  `"V1 shell supports at most 5 top-level destinations (got N)"`.
- This is a **target capability limitation, NOT an IR validation error.** It lives in the
  pattern-selection/planning module, reported as a generation error — **never** a schema/`[ir]`
  gate, and it does not forbid the IR from existing. A 6-feature IR is a valid application; V1's
  shell just can't render 6 top-level tabs.

### 2.4 Emit (routing + shell)

- `builder/src/generators/route.ts` — for the multi-feature path, wrap the per-feature route
  branches in a `StatefulShellRoute.indexedStack` whose root is a new generated shell screen;
  the shell renders `NavigationBar` from the destination list (title + icon + index), tapping a
  destination switches the `indexedStack` branch (and thus that feature's stack).
- New shell screen generator (additive file under `builder/src/generators/`, e.g.
  `app_shell.ts` → `generateAppShell(destinations, ctx)` returning a `// [generated]
  generator=AppShellGenerator template=app_shell.v1 class=pattern ownership=generated` file).
  Keep the header convention + no I/O (pure `(IR, ctx) → string`).
- `project.ts` `generateMultiMain` already emits the multi-feature main; the shell becomes the
  router's root builder — verify the wiring end-to-end with ledgerly.
- **Single-feature path must stay byte-identical** (`features.length <= 1` → no shell, current
  flat `GoRouter`). Prove with a pre/post diff.

### 2.5 Validate gates (additive, isSwiftUI-guarded + multi-feature-guarded)

- `[shell]` gate (validate.ts, additive, only when a shell is emitted):
  - shell exists when `features.length > 1`; absent when `== 1`;
  - destination order == `features[]` order (byte-order compare against the IR);
  - destinations <= 5 (target-capability check reflected here as a planning artifact — the hard
    error is thrown at generation; the gate re-asserts it on output);
  - each destination has a title + an icon (from the stem map).
- Existing gates unchanged (`[oracle]`, `[platform]`, `[swiftarch]`, … all stay PASS).

### 2.6 Composition/plan interplay

- `composition.ts` + `plan.ts` are the selection home (contract §1). Do not move the decision
  into `route.ts` beyond consuming the decided list.

## 3. What P1 must NOT touch

- No single-feature output change (byte-identical; prove via diff).
- No `screen.ts` behavior change (no hidden heuristics; it consumes payloads only).
- No changes to any single-feature app sample (`tasks`, `work_auth`, `hr_service` are
  single-feature — verify with `len(ir.features)`; only `ledgerly` (4 features) is multi-feature
  today). Single-feature apps must stay byte-identical.
- No drawer, no rail, no search, no scroll behavior, no action menu (those are P2/P3/P4/D2).
- No IR/schema changes (no new IR keys; destination title comes from existing entity fields).
- No third-party packages (SDK material + go_router only).
- No deletes. No commits unless the orchestrator/owner asks.

## 4. Verification (run in repo root; all must pass)

```bash
# 1. Typecheck
npx tsc -p builder/tsconfig.json --noEmit

# 2. Byte-identical single-feature proof (pick a single-feature app, e.g. tasks):
npx ts-node --transpile-only builder/src/index.ts apps/tasks/input/tasks.ir.json /tmp/p1_a
npx ts-node --transpile-only builder/src/index.ts apps/tasks/input/tasks.ir.json /tmp/p1_b
diff -r /tmp/p1_a /tmp/p1_b && echo "SINGLE-FEATURE DETERMINISTIC"

# 3. Ledgerly regenerates with shell:
npx ts-node --transpile-only builder/src/index.ts apps/ledgerly/input/ledgerly.ir.json /tmp/p1_ledgerly
find /tmp/p1_ledgerly/ios -type f 2>/dev/null | head -1  # ignore; flutter path:
grep -rl "NavigationBar\|StatefulShellRoute" /tmp/p1_ledgerly/lib/ | head
npx ts-node --transpile-only builder/src/validate.ts apps/ledgerly/input/ledgerly.ir.json /tmp/p1_ledgerly
# expect [shell] PASS + all existing gates PASS

# 4. >5 destination error probe: craft a scratch multi-feature IR (6 features) under
#    apps/<app>/output/qa/p1_probe_6.ir.json (repo copy per AGENTS rule 11), expect the
#    explicit "supports at most 5 top-level destinations" generation error (exit != 0).

# 5. Flutter: cd /tmp/p1_ledgerly (or regenerate into apps/ledgerly/output/app per convention)
#    flutter pub get && flutter analyze && flutter test  (update goldens first if UI-affecting)
```

Then update the working app: regenerate `apps/ledgerly/output/app` (the disposable outDir) from
the new generator, rebuild web (`flutter build web`), and drive it via the shared CDP driver
(AGENTS rule 14): boot → semantics → tap each bottom-nav destination → verify each feature's
stack loads + state preserved across switches → overflow scan at 320/390/768/1280 → screenshots
under `apps/ledgerly/output/qa/p1-shell/`. Write findings (symptom/root-cause/location/severity)
to that folder.

## 5. Deliverable back to orchestrator

1. File-by-file diff for `builder/src/` (paths + what + why, with contract §cites).
2. The generated shell file (verbatim) + how it wires into the router/main.
3. Verification output verbatim (§4), including the `[shell]` gate PASS and the >5 probe error.
4. Confirm zero changes to single-feature output and zero IR/schema edits.

## 6. Next (do NOT build in P1)

P2 per-list search (explicit `search:` composition block) → P3 scroll behavior → P4
capability-driven actions → P5 merged into DESIGN_OPTS D2. Contract §8.