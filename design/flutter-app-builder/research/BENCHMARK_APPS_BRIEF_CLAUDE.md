# BENCHMARK-APPS — benchmark every real generated app — implementer brief

**For:** Claude Code (s-hermetic) — implementer lane
**Date:** 2026-08-19
**Zen orchestrator:** owner request "ask claude to benchmark real apps" (the owner wants a
ground-truth benchmark of what the generator currently SHIPS, app by app — not what the design
says it should — to decide enhancement priorities; this feeds the upcoming offline-first kids
Q&A app design)

## Task

Produce a **benchmark report over the real, generated apps** in `apps/` (this is the owner's
"benchmark available apps" ask, done properly). Bench the six live apps:
`keemart`, `tasks`, `work_auth`, `hr_service`, `ledgerly`, `rasheed`.

Result: `apps/BENCHMARK_APPS_REPORT.md` (additive; commit it). Evidence-based, numbers from the
actual generated output and real `flutter analyze`/`flutter test` runs — never from the design
docs alone.

## What to measure (per app)

For each app, fill every row from the REAL generated output (`apps/<app>/output/app/`):

1. **Identity**: name, IR path, layout/archetype(s) actually generated (list/detail/wizard/
   sections), plan.json decisions (stateManagement provider, routing, persistence, coupledPair).
2. **Feature surface actually consumable by a user** (walk the generated routes):
   search (which screens), scroll tint, refresh/pull + retry, export/audit, budget, sections
   (hero/cards/grids), wizard steps, business rules (from input/rules/*.oracle.json), outbox,
   tenant/auth scoping, goldens present.
3. **Size**: lib/ file count + total LOC (generator-emitted), features/ dirs, plans/tests count.
4. **Verification evidence** (run these, record exact output):
   - regenerate `apps/<app>/output/app` from `apps/<app>/input/<app>.ir.json` via
     `npx ts-node --transpile-only builder/src/index.ts <ir> <out>`,
   - `npx ts-node --transpile-only builder/src/validate.ts <ir> <out>` → all gates PASS (name
     the gates),
   - `flutter analyze` in the app dir,
   - `flutter test` in the app dir (test count green),
   - determinism: two regens → `diff -r` empty.
   Keep goldens: if any golden changed semantically, note it; do NOT `--update-goldens` silently.
5. **Strengths / weaknesses as a demo** (1-2 lines each): what a human testing it on iPhone
   would notice (per app), incl. any known gap (e.g. decorative pieces now fixed, in-memory repo,
   persistence schema-only, no real web/ dir for some, etc.).

## Cross-app summary (top of report)

- Table: name | archetype(s) | pers | sm | screens | search | scroll | refresh | export | rules | tests | LOC | gates | flutter test
- **What the tool demonstrably ships today** (3-5 bullets, evidence-backed).
- **Cleanest "reference app" to copy for a new app build** (recommend one: best all-round demo
  of list+detail+wizard+search+rules+states) + **best showcase app** (visual/sections).
- **Top gaps the kids-Q&A/next-app build should watch** (e.g. persistence wiring, web/ regen,
  riverpod parity gap if real, missing golden coverage).

## Constraints

- Read-only on generated apps EXCEPT regeneration + verification commands above (regeneration is
  the sanctioned pipeline step — the docs/commit history already regen apps). Never edit generated
  app source by hand. If a regen DIFFS meaningfully from committed output, report the diff
  summary and commit the regen as its own slice (small commit) only if it's a faithful pipeline
  output.
- Deterministic generators are 0% LLM — you're benchmarking, not modifying `builder/src`.
- Report findings; do NOT change generator behavior. Any defect found → list as a finding with
  severity and a suggested RCA location; do not fix in this slice.
- Small commits: 1) the report, 2) any faithful regen diffs (separate commits per app if
  meaningful).

## Deliverable

`apps/BENCHMARK_APPS_REPORT.md` committed + pushed. Final message to the orchestrator: the
summary table, the recommended reference app, and top gaps — with command outputs for the
per-app verification rows.

When done, report to the orchestrator (this session) with the report path + summary. Do NOT report
to the owner directly.