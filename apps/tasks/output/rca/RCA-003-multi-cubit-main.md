# RCA-003 — main.dart only provided the first screen's cubit → runtime crash on second entity

App: tasks (apps/tasks/). Date: 2026-08-15. Severity: p1 (any multi-entity app crashed on
navigation to a second list/detail route).

## Symptom
`flutter test` on a golden harness navigating to `/follow-up` threw:
```
ProviderNotFoundException: Could not find the correct Provider<FollowUpListCubit>
```
`TaskDetailScreen`'s new "View FollowUps" row navigated to the FollowUp list, whose body reads
`BlocBuilder<FollowUpListCubit, ...>` — but no `FollowUpListCubit` was provided above it. The real
app would crash the same way at runtime.

## Root cause
`builder/src/generators/project.ts` → `generateMain()` wrapped ONLY `feature.screens[0]`'s cubit
in a `BlocProvider`:
```
return BlocProvider<TaskListCubit>(create: ..., child: MaterialApp.router(...));
```
Single-entity samples (expense, todo, promo, wizard) never had a second cubit to provide, so the
bug went unnoticed. The tasks sample (Task + FollowUp = two list states, two cubits) exposed it the
moment a route for the second entity rendered.

## Fix
`generateMain()` now computes the distinct set of states across ALL declared screens and nests one
`BlocProvider<XCubit>` per state, so every route's cubit is in scope:
```
return BlocProvider<TaskListCubit>(create: ..., child: BlocProvider<FollowUpListCubit>(create: ..., child: MaterialApp.router(...)));
```
Riverpod branch unchanged (ProviderScope self-builds). Single-entity output is byte-identical
(one BlocProvider, same as before).

## Verification
- typecheck clean; tasks regenerated; analyze clean; all 13 tests pass (golden + flow + crud + rules).
- FollowUpListScreen renders + golden captured via the real route (`/follow-up?taskId=...`).
- Regression: all 7 legacy samples still validate.

## Prevention
Any generator that emits a per-screen provider wrapper must derive it from ALL screens/states, not
`screens[0]`. Multi-entity samples (any `<Parent>Id` child relationship) exercise the
multi-cubit path automatically; a multi-state sample belongs in the regression suite.
