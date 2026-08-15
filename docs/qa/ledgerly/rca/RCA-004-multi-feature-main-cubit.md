# RCA-004 — multi-feature main.dart only provided each feature's first-screen cubit

Sample: ledgerly (builder/samples/ledgerly.ir.json, MF1 multi-feature IR). Date: 2026-08-15.
Severity: p1-latent (would crash any multi-feature app where a feature has more than one screen
state, same failure mode as RCA-003 — not yet triggered by any committed sample).

## Symptom

None observed yet in a real generated app — caught by code inspection while resuming MF1 after
`275da9d` landed the RCA-003 fix for `generateMain()`. `generateMultiMain()` (the MF1 equivalent,
used when an IR has `features: [...]` instead of a single feature) had not received the same fix.

Confirmed via a throwaway probe (not committed) calling `generateMultiMain()` directly with a
synthetic two-feature app where one feature (`expenses`) declares two screens on two *different*
states (`ExpenseClaimListScreen` → `ExpenseClaimList`, `ExpenseClaimDetailScreen` →
`ExpenseClaimDetail`): the pre-fix code emitted providers for `UserListCubit` and
`ExpenseClaimListCubit` only — `ExpenseClaimDetailCubit` was silently dropped, which is exactly the
`ProviderNotFoundException` shape RCA-003 documented.

`builder/samples/ledgerly.ir.json` itself never exposed this: its `expenses` feature has two
screens (list + detail) that both point at the *same* state (`ExpenseClaimList`), so
`screens[0].state` happened to equal the full distinct-state set. The bug was latent, not visible
in `flutter analyze`/`flutter test` on the existing sample.

## Root cause

`builder/src/generators/project.ts` → `generateMultiMain()` computed its provider set as:
```ts
const primaryStates = Array.from(new Set(features.map((f) => f.screens?.[0]?.state).filter(Boolean)));
```
i.e. one state per **feature**, taken from that feature's first screen only — the exact
`screens[0]`-only pattern RCA-003 fixed in `generateMain()`, just applied one level up (per-feature
instead of per-app). A feature with more than one screen state (a list+detail pair with distinct
states, or any feature gaining a second list/detail route) would have its later cubits go
unprovided.

## Fix

`generateMultiMain()` now derives the provider set from **every screen of every feature**, matching
RCA-003's prevention note verbatim ("derive it from ALL screens/states, not `screens[0]`"):
```ts
const distinctStates = Array.from(new Set(features.flatMap((f) => (f.screens ?? []).map((s) => s.state))));
```
`generateMain()` (single-feature, RCA-003) is untouched. Riverpod branch unchanged (`ProviderScope`
self-builds regardless of screen/feature count).

## Verification

- `npm run typecheck:builder` — clean.
- Probe (synthetic 2-feature model, one feature with 2 distinct-state screens): fixed output
  provides both `ExpenseClaimListCubit` and `ExpenseClaimDetailCubit`; pre-fix code dropped the
  second. Not committed (throwaway, deleted after use) — reproducible by calling
  `generateMultiMain()` directly with the shape described above.
- ledgerly regenerated: 48 files, `[determinism] PASS (byte-identical)`, all 8 validate gates PASS.
  `main.dart`'s provider list is unchanged (still 3 providers) — expected no-op, since ledgerly's
  `expenses` screens share one state; proves the fix doesn't regress the existing sample.
- `flutter pub get && flutter analyze` (0 issues) `&& flutter test --update-goldens && flutter
  test` on regenerated ledgerly — 5/5 passed, both runs.
- Full regression loop (all `builder/samples/*.ir.json`) re-run after the fix: no new failures.
  Two pre-existing, unrelated failures confirmed present at `275da9d` as well (isolated via
  `git stash` on `project.ts` alone, so not caused by this fix):
  - `expense.ir.json` (legacy, pre-`schemaVersion` fixture) fails the pipeline's schemaVersion
    guard — `expense.semantic.ir.json` (the schemaVersion-bearing sibling used by the real
    regression suite) passes.
  - `rasheed.ir.json` fails `[strategy-fidelity]`: `plan.json` declares `state:AllExpenses`
    strategy `sealed-events` but the emitted template is `state_enum_status.v1` — a
    scoring/template drift unrelated to money or multi-feature work, out of scope here.

## Prevention

Any generator that emits a per-screen/per-state provider wrapper (bloc's `BlocProvider`/
`MultiBlocProvider`, or an equivalent for a future state-mgmt provider) must derive its input from
**all** screens in scope, never `screens[0]` — true whether "in scope" means one feature
(`generateMain`, RCA-003) or a whole multi-feature app (`generateMultiMain`, this RCA). A future
MF-flavored generator touching screens/states should grep for `screens?.[0]` / `screens[0]` as a
quick self-check before landing.
