# Persistence — requirement-driven arch selection (grilled, common ground)

> Grilled 2026-08-15 (owner + orchestrator). Source research:
> `research/persistence_benchmark.json` (deepseek-flash) + `research/cdp_flow_test.json`.
> This is the DESIGN for P6-F2; implement after the SOLID fixes, per agreed order:
> SOLID → persistence → CRUD → CDP flow → feedback loop.

## Decision: persistence is an ARCHITECTURE decision (§5.2-style), not a bolt-on
`decideArchitecture(ir)` returns `persistence: "none" | "sql" | "nosql"`, recorded in
`plan.json` `scoring` like stateManagement/DI/routing.

### Selection (deterministic, SQL-biased — locked)
```
if attributes.persistence is set → use it (explicit override wins).
else score SQL-affinity vs NoSQL-affinity from requirements:

  sqlScore = offline-first(3) | cache(1)
           + hasRelationships(entity reference fields)(2)
           + queryAxes >= 3 (filters/joins/aggregates)(1)
           + full CRUD surface(1)

  nosqlScore = cache(2)
             + document-shaped (nested List/blob fields)(2)

  persistence = sqlScore >= 3 → "sql"
              | nosqlScore >= 2 → "nosql"
              | else → "none" (in-memory)
```
SQL-biased by design: relational/offline-first/joins → SQL (drift); cache/document-shaped → NoSQL
(hive_ce); trivial demos → in-memory.

### Backends (from benchmark)
- **SQL → drift** (schema-driven, web via sqlite3.wasm, mobile native). `mig=codegen`.
- **NoSQL → hive_ce** (web IndexedDB, typed adapters, low ceremony).
- Deferred: objectbox (no web), isar (discontinued), sqflite (no web, superseded by drift),
  shared_preferences (not a real DB).

## Demo behavior (locked)
- Repository impl uses the **real DB adapter where the platform supports it** (hive on web,
  drift on mobile) with an **in-memory fallback for web/drift** so CDP flow tests stay
  deterministic. Adapters generated + schema emitted + pubspec dep added; verified by unit tests.

## P6 order (locked)
1. F1 CRUD sample — repo impl mutates the in-memory list (create/update/delete); generated
   forms for create/edit + delete action; collection name derived from entity (fixes SOLID #4).
2. F2 persistence — arch selection above + drift/hive adapters + `persistence.ts` registry.
3. F3 CDP flow tests + flow goldens — drive served app over CDP through
   list→create→detail→update→delete (steps in `research/cdp_flow_test.json`); screenshot per step.
4. F4 feedback loop — test results → RCA → fix → re-test until green; RCA under `docs/qa/<sample>/rca/`.

## Files to touch
- `types.ts` (`AppAttributes.persistence`, `PersistenceKind`), `scoring.ts` (add `persistence` to
  `ScoringDecision` + sql/nosql scores), `arch.ts` (`ArchitectureDecision.persistence`), new
  `persistence.ts` registry (drift/hive/none: package + template + adapter), `project.ts` pubspec
  (persistence dep), `repository_impl.ts` (adapter wiring + in-memory fallback), `index.ts`
  (thread arch.persistence into plan/pubspec).
