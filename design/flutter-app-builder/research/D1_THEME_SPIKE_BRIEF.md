# S-D1 — Theme wiring spike: implementation brief (for remote opencode agent)

> **Executor:** remote opencode agent. **Source:** `/root/fg-p5` (repo `aboodysa/flutter_generator`,
> public, clone/`git pull --ff-only origin master` before starting). **Type:** SPIKE — read-only,
> NO code edits, NO commits, per SPIKE_PROTOCOL. Produce the §17 report + ONE decision.

## Why now
This is the **Slice D1 prerequisite** of P5/D2. The S-P5/D2 spike (decision **MODIFY**, report at
`design/flutter-app-builder/research/SPIKE_P5_D2_REPORT.md`) concluded that D1 (`buildTheme()`
wired into the app root) must land and be verified **independently first** before D2 placement
work, because D2's richer Loading/Error/Empty states need the theme tokens D1 wires in. D1 touches
only `generators/project.ts` (main.dart) — no ownership conflict with composition/screen.

## Contract / plan to read first (in that order)
1. `design/flutter-app-builder/research/SPIKE_PROTOCOL.md` — binding spike rules.
2. `design/flutter-app-builder/research/DESIGN_OPTS.md`
   - **Slice D1** (around `:204-206`),
   - **O1.1** wire `buildTheme()` into the app root (`:35-39`),
   - **O1.2** brand-seed via IR attributes (`:41-45`),
   - **O1.3** dark mode via `attributes.themeMode` (`:47-51`),
   - **O1.4/O1.5** density/radius presets — **OUT of scope** this spike (see non-goals),
   - **§8 arch-linter** (raw-literal radius/color rule) and the `[theme]` validator intent.
3. The S-P5/D2 report decisions (`research/SPIKE_P5_D2_REPORT.md` §13-14) — D1 is called out as the
   prerequisite slice; align, don't duplicate its placement work.
4. `design/flutter-app-builder/research/SPIKE_PLAN.md` §P5 (`:246-295`) acceptance gates for D1.

## Hypothesis
> "The theme token system already emitted by the generator (`buildTheme()` in
> `core/theme.dart`) is dead code in the running app — `main.dart` emits
> `ThemeData(colorSchemeSeed: Colors.teal)` and never `theme: buildTheme()`, so none of the
> semantic colors/radius/spacing/filled inputs reach a real screen; goldens hide this because they
> wrap the widget tree in `buildTheme()` ourselves. Wiring `buildTheme()` (+`buildThemeDark()` /
> `AppColors` seeded from an IR `attributes` value, `themeMode: light|dark|system`) into the app
> root is a small, deterministic, high-leverage fix that makes the generated app finally honor its
> design — and it is a hard prerequisite for the P5/D2 richer-state work."

Test whether wiring the theme as assumed (O1.1+O1.2+O1.3 in one D1 slice) is the right, minimal,
byte-identical-safe implementation.

## Ground truth to establish (read BOTH generator source AND generated output)
- `builder/src/generators/project.ts` `main.v1`: confirm the exact emitted `ThemeData(…)` in the
  generated `lib/main.dart` (DESIGN_OPTS says `main.dart:28`). Confirm it does NOT set `theme:`,
  `darkTheme:`, or import `core/theme.dart`.
- `builder/src/generators/core/theme.dart` (or wherever `buildTheme()`/`AppColors`/`AppTokens`/
  `AppTheme` live): confirm `buildTheme()` and any `buildThemeDark()` already exist and are
  correct, and exactly what tokens the running app currently loses (the DESIGN_OPTS `M3` already
  shipped row `:15-16`).
- `builder/src/scoring.ts` + `builder/src/types.ts` `AppAttributes`: which of `brandSeedColor`,
  `brandFontFamily`, `themeMode`, `density`, `roundness` are **already parsed** vs missing? DESIGN_OPTS
  O8.1 says some already exist — enumerate the actual current enum/keys in `AppAttributes`.
- `builder/src/generate/...`/`infra.ts` (the theme/token emission module): how `AppColors.primary`
  and fonts are currently built (raw literals vs seed-derived).
- `builder/src/validate.ts`: is there already a `[theme]` gate or the arch-linter raw-literal check?
- Generated output for ONE sample (regenerate e.g. `apps/tasks/output/app` via
  `npx ts-node --transpile-only builder/src/index.ts` into a scratch dir) and read the real
  `lib/main.dart` + `lib/core/theme.dart` — ground all claims in emitted code, not just generator
  source.

## Questions evidence must answer (SPIKE_PROTOCOL §6)
1. Is the "theme is dead code in the running app" claim TRUE today? (Confirm `main.dart` really
   doesn't wire `buildTheme()`, and that real screens therefore render with the `ColorScheme.fromSeed`
   teal default, not the token system.)
2. What is the minimal deterministic emission? `main.v1` should emit `theme: buildTheme(),
   darkTheme: buildThemeDark(), themeMode: _mode` with `_mode` resolved from `attributes` — confirm
   this is identical-string-deterministic and needs only an import + a few lines. Is `buildThemeDark()`
   already implemented or does D1 also need it? (O1.1/O1.3 differ on this.)
3. O1.2 brand-seed: is `attributes.brandSeedColor` already a field, or does D1 need to add it to
   `AppAttributes` + parse path + `infra.ts` seed derivation? Is there an existing validator `[theme]`
   or arch-linter raw-literal rule to run against, or does D1 need to add the forbid-raw-palette check?
4. Dark-mode goldens: `*_dark.png` only generated `when themeMode == dark` (O1.3) so existing light
   goldens don't churn. Confirm the golden-test generator branches on `attributes.themeMode` today,
   or whether D1 must add that branch. Also: the golden test currently wraps the tree in `buildTheme()`
   — after D1 wires the app root, can the golden harness stay as-is (safe) or must it change (and is
   that a byte-identical/compat risk)?
5. Does D1 require **any** IR/`types.ts` schema addition (the P5/D2 report's §14 principle was "no
   IR changes for D2" — is that also true for D1, or does brand-seed legitimately need an `attributes`
   field)? If a field is added, is it backward-compatible (default = today's teal → no golden churn
   except the one-time wire)? Determine determinism impact.
6. Ownership screen: confirm NOTHING in D1 touches `composition.ts`/`screen.ts` pattern-selection
   (the P1–P4 / P5-D2 surfaces) — so wiring can proceed independently and be verified by `flutter
   analyze` + light goldens before D2.

## Determinism / ownership / failure-mod (SPIKE_PROTOCOL §6-12)
- Inputs: IR `attributes` (parsed) + the deterministic theme/token emission already in `infra.ts`.
- Keep changes inside `generators/project.ts` (+ possibly `infra.ts` and — only if O1.2 forces it —
  a backward-compatible `AppAttributes` field, with default = current teal).
- Failure modes for: `themeMode` absent (default light/system), `brandSeedColor` absent (teal),
  dark goldens when off (must not churn existing goldens), no `[theme]` validator present (does D1
  add the forbid-raw-palette check or leave to a follow-up?) — state the deterministic outcome for each.
- **Byte-identical backward-compat proof**: any IR that doesn't set the new attributes must still
  generate an app where the only diff vs pre-D1 is the `theme:`/`darkTheme:`/`themeMode:` wiring
  (not unrelated churn). If `buildThemeDark()` must be newly generated, golden `*_dark.png` set only
  when `themeMode == dark`.

## Deliverable — §17 spike report
`SPIKE_D1_REPORT.md` under `design/flutter-app-builder/research/` (or repo root if not yet synced),
all 17 sections, ending with ONE decision:
- ADOPT/MODIFY/REJECT/DEFER/SPLIT/ESCALATE, with evidence.
- If ADOPT/MODIFY: the precise D1 slice(s) (what to wire in project.ts/main.v1 + infra.ts seed
  derivation + whether `AppAttributes.brandSeedColor`/`themeMode` already exist or must be added
  backward-compatibly + dark-golden gating logic + validator `[theme]` scope), the 1-3 sub-slices
  for implementation, and the test/golden/verify matrix.

## Constraints
- Read-only; NO `builder/src/**` edits, NO commits during research.
- Report the DECISION + key evidence to the orchestrator (Telegram/opencode return). Full report saved
  to a file.
- No heavy Flutter builds on this box (it's 1vcpu/1gb or the 4gb box — either way avoid `flutter run`;
  `flutter`/dart may not even be installed — verify with `which flutter` before any golden work; if
  absent, defer golden verification to the Mac and just produce the emission plan + `flutter analyze`
  static reasoning, or use the owner's Mac pipeline step).
- If a step is blocked (no flutter, no npm deps, quota), say so and park — never fake evidence or
  improvise the decision without grounding.

Environment: repo is at `/root/fg-p5` (public https, can `git pull --ff-only origin master`).
`npm ci` needed for ts-node if you must generate a scratch app. Confirm the channel is idle before
starting.
