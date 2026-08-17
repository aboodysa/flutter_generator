# S-HERMETIC — Implementation brief for Claude Code (Mac)

**From:** Orchestrator (zen) — **To:** Claude Code (implementer, Mac) — **Date:** 2026-08-18
**Source of truth:** `design/flutter-app-builder/research/SPIKE_S_HERMETIC_REPORT.md` (§13 decisions, §14 implementation, §15 rejected, §16 open).
**Task:** Implement S-HERMETIC per the spike's S-sized plan (§14.1-14.4) NOW, after owner ratification of the flagged decision-log items below.

## Ratified decisions (owner-call items from §16, decided by orchestrator per agreement)

1. **SDK floor (§14.2):** generated `pubspec.yaml` `sdk: ^3.0.0` → `sdk: >=3.11.0 <4.0.0` — the floor PROVEN by every committed lock's `sdks:` block (dart >=3.11.0). This keeps caret ranges (D1) and refuses the stale 3.0 claim without hard-pinning.
2. **`[lockfile]` severity (§16):** floor-differs = **warning**, missing lockfile = **error** (historical locks are accepted as warning; absence is a governance break).
3. **`localeDataVersion` (§14.2):** drop the literal stale claim `"intl-0.19.0"` in `context.ts:37` — replace with the intl version **resolved from the app's committed `pubspec.lock`** at generation time (pure: lock is committed input); omit the field entirely when no lock is present. Never hardcode again.
4. **Lock-refresh ceremony (§16):** document (in the FLUTTER_TOOLCHAIN doc, not new tooling) that each natural regenerate should `pub get && git add */pubspec.lock` so commits stay coherent.

## What to implement (report §14, in ONE S-sized slice — 14.1+14.2+14.3)

### 14.1 — Two additive gates in `builder/src/validate.ts`
- `[lockfile]`: for each regenerated app output, assert `pubspec.lock` exists. When present, parse its `sdks:` block and compare `dart`/`flutter` floors against a declared toolchain floor constant (from the ratified FLUTTER_TOOLCHAIN doc). missing → ERROR; floor-differs → WARNING (per ratification #2). Add `lockfile` + `timestamps` to the FAIL sum where the other gates are summed (report cites `validate.ts:1329` — find the actual line).
- `[timestamp]`: scan every walked file's **header band** (first 4 comment/header lines before the first `import`/`dependencies`) for `/\d{4}-\d{2}-\d{2}/` and `/Generated on|generated on| at \d{1,2}:\d{2}/`. Never scan body lines (runtime `DateTime.now()` is intentional content — naming.ts:45, audit.ts:61 must NOT trip it).

### 14.2 — Packaging (keep caret ranges)
- `project.ts:51` → `sdk: >=3.11.0 <4.0.0`.
- `context.ts:37` → resolve intl version from the committed `pubspec.lock`; omit if absent.

### 14.3 — `FLUTTER_TOOLCHAIN.md` (new doc, additive)
Table: flutter/dart/devtools from `SWIFTUI_GROUND_TRUTH.md:91-93` (Flutter 3.44.3 / Dart 3.12.2 / DevTools 2.57.0), per-app lock `sdks:` floors, the L1/L2 two-layer contract, the lock-refresh ceremony (ratification #4), and the C12 closure note ("commit lockfile per app = policy"; SDK floor ratified). Reference it from DESIGN.md or DETERMINISM_CONTRACT if a natural pointer exists (additive only).

## Verification (report §14.4) — all mandatory
1. `npm run typecheck:builder` clean.
2. Regenerate all 4 apps + samples, then `validate.ts` on each — `[lockfile]`/`[timestamp]` PASS.
3. **Negative controls (real run):** (a) delete `pubspec.lock` from one app output → `[lockfile]` FAIL (error); (b) hand-insert `// generated 2026-08-18` into a header → `[timestamp]` FAIL; (c) confirm an untouched app PASSes both. Undo the hand-edits afterward (verify via `git status` clean)/regenerate.
4. `flutter pub get` on ONE regenerated app → lock recreated; `diff` vs the prior committed lock shows only the intended SDK-floor ceiling change.
5. Existing gates all still PASS (regression: `[theme]`, `[states]`, `[search]`, `[scroll]`, email-form — Slice 4's gate must survive).

## Constraints
- Additive, no deletions. Generated-code ownership (headers, regions) unchanged. No IR/schema change (packaging/config + validation + docs only — the spike §6 contract).
- Do NOT do S-DEEPLINK, do NOT start any visual-lane (S1-S7) or v2-contract work. S-HERMETIC only.
- Small commits, one logical slice each (gates; packaging; doc). This is S-HERMETIC'S implementation pass — it closes C12.

## Deliverable
Small commits post verified doD. Final chat summary ≤12 lines: files changed + gate wiring line numbers + negative-control outcomes + commit hashes.