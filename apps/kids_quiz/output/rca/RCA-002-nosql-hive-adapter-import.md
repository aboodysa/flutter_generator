# RCA-002 — nosql hive adapter broken relative import

## Symptom

`flutter analyze` on a `persistence:"nosql"` app emits 5–8 `uri_does_not_exist` /
`undefined_identifier` errors per entity. The generated `*_adapter.dart` files reference
types they cannot resolve:

```
error • Undefined name 'QuizCategory'. • lib/.../data/local/question_adapter.dart:18:17
error • Undefined name 'CorrectOption'. • lib/.../data/local/question_adapter.dart:24:16
```

## Investigation

1. Generated `question_adapter.dart` had `import 'question.dart';` — a bare relative import
   from `data/local/` that resolves nowhere (entity lives at `domain/entities/question.dart`).
2. `generateHiveAdapter` (`persistence.ts:83`) accepted `(entity, enums, valueObjects, typeId)`
   — no `GenContext`, so no access to `ctx.symbols` (the symbol table every other generator uses).
3. `index.ts:620` called it without `ctx` — the only generator call site in the entire codebase
   that doesn't thread `GenContext` through.
4. Enum types (`f.of`) referenced in `hiveReadExpr` (`QuizCategory`, `CorrectOption`, etc.) were
   also missing imports — the `read()` method calls `${enumType}.values.byName(...)` but never
   imports the enum.
5. Never caught before: rasheed (the only other `nosql`-scored app) has `watchTransactions` as
   its repo op (returns `Stream<TransactionsPage>`, not `Future<List<Entity>>`), so
   `listEntityName()` returns null and the persistence loop never fires. kids_quiz was the first
   real app with a `list`-shaped repo + `persistence:"nosql"`.

## Root cause

**`generateHiveAdapter` was structurally isolated from the symbol table.** It emitted a bare
relative import (`import '${fileName(entity.name)}';`) because it had no way to look up the
correct package-resolved path. The call site in `index.ts` (`writeFeatureArtifacts` persistence
block) was the only artifact loop that didn't pass `ctx` — a one-line oversight from the original
implementation, not a design decision.

Additionally, enum field types (`f.of`) used in the `read()` body were never imported at all —
the function assumed the entity file re-exports them, but the adapter lives in `data/local/`,
not `domain/entities/`, so it needs its own imports.

## Fix

**`persistence.ts`**:
1. `generateDriftTable(entity, ctx?)` — optional `GenContext`; uses `ctx.symbols.get(entity.name)`
   for the entity import (falls back to bare relative if absent, preserving backward compat for
   any caller that doesn't pass ctx).
2. `generateHiveAdapter(entity, enums, valueObjects, typeId, ctx?)` — same ctx pattern + collects
   all `f.of` enum types from entity fields, emits a resolved import for each (via `ctx.symbols`
   or bare relative fallback).

**`index.ts`**: call site passes `ctx` through to both functions.

## Verification

- `npm run typecheck:builder` — clean.
- `validate.ts` on kids_quiz — 37/37 gates PASS.
- `flutter analyze` — 0 errors (46 info/warnings, all pre-existing cosmetic patterns).
- `flutter test` — 57/57 passed.
- Determinism — double regen byte-identical.
- Backward compat — keemart/tasks/work_auth/hr_service/ledgerly all byte-identical regen.

## Prevention

The `[persistence]` validate gate (added in this fix) re-derives the expected adapter/drift
imports and cross-checks the generated files, catching any future regression where an import
path doesn't resolve.
