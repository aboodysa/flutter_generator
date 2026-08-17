# S-D1 — Theme wiring: is `buildTheme()` wired into the app root, and is the one-slice (O1.1+O1.2+O1.3) packaging right, minimal, and byte-identical-safe?

> Spike report, §17 format (SPIKE_PROTOCOL.md §17). Research-only — no `builder/src` edits, no
> commits, no regeneration, no npm/ts-node runs (per the brief's read-only source mode). All claims
> grounded in generator SOURCE reads + the ALREADY-COMMITTED generated outputs in this repo.
> Repo: `/root/fg-p5`, HEAD `0a64b45` (pre-existing staged `node_modules/` / `package-lock.json`
> deletions in the tree are unrelated to this spike and were not touched).
> Brief: `research/D1_THEME_SPIKE_BRIEF.md`. Predecessor: `research/SPIKE_P5_D2_REPORT.md` (MODIFY).

## 1. Status

Research-only. **No** generator or app code was modified; **no** scratch generation was run (the
box OOMs on `npm ci`/ts-node — read-only source mode). Evidence is 100% source inspection:
generator templates + committed outputs under `apps/*/output/app/`. No Flutter SDK on this box
(`command -v flutter dart` empty), so golden/CDP verification is argued statically and deferred to
the Mac pipeline (brief §Constraints).

## 2. Hypothesis

> "The theme token system already emitted by the generator (`buildTheme()` in `core/theme.dart`)
> is dead code in the running app — `main.dart` emits `ThemeData(colorSchemeSeed: Colors.teal)`
> and never `theme: buildTheme()`, so none of the semantic colors/radius/spacing/filled inputs
> reach a real screen; goldens hide this because they wrap the widget tree in `buildTheme()`
> ourselves. Wiring `buildTheme()` (+`buildThemeDark()` / `AppColors` seeded from an IR `attributes`
> value, `themeMode: light|dark|system`) into the app root is a small, deterministic, high-leverage
> fix that makes the generated app finally honor its design — and it is a hard prerequisite for the
> P5/D2 richer-state work."

Tested as written, **including the packaging assumption** (O1.1+O1.2+O1.3 in **one** D1 slice).

## 3. Ground truth

### 3.1 Generator source — the app root (`builder/src/generators/project.ts`)

`theme: ThemeData(colorSchemeSeed: Colors.teal),` is hardcoded in **five** places, one per
template branch:

| Line | Template | Branch |
|---|---|---|
| `project.ts:127` | `main.v1` | riverpod router |
| `project.ts:135` | `main.v1` | bloc router |
| `project.ts:192` | `main.v1` | no-screens demo shell |
| `project.ts:223` | `main_multi.v1` | riverpod router |
| `project.ts:233` | `main_multi.v1` | bloc router |

None of the branches emit `theme:` from `buildTheme()`, nor `darkTheme:`, nor `themeMode:`, nor
`import 'core/theme.dart';`. Neither `generateMain` nor `generateMultiMain` reads any theme
attribute (`attributes` is only touched for `stateManagement`/`locale`).

### 3.2 Generator source — the token system (`builder/src/generators/infra.ts`)

`generateTheme` (infra.ts:192-253) emits a **fully static** template:
- `AppColors` — `primary = Color(0xFF0D9488)` + semantic `error/success/warning/danger/info`
  (+ `surface/textPrimary/textSecondary`).
- `AppSpacing` (4/8/16/24/40), `AppRadius` (12/16/24).
- `buildTheme()` — M3 `ColorScheme.fromSeed(seedColor: AppColors.primary, brightness: light)`,
  `scaffoldBackgroundColor: Color(0xFFF8FAFC)`, `useMaterial3`, `fontFamily: 'Roboto'`,
  `cardTheme` (radius `AppRadius.surface`, elevation 0), filled `inputDecorationTheme`
  (`fillColor: Color(0xFFF1F5F9)`).
- **No `buildThemeDark()`** — the only dark-mode trace is a comment (`infra.ts:199`).
- The function parameter `_f: FeatureModel` is **unused** — no attributes path into the theme at
  all. `index.ts:121` emits `theme.dart` unconditionally via `generateTheme(ir)`.

### 3.3 Generator source — attributes schema (`builder/src/types.ts`) + scoring

`AppAttributes` (types.ts:156-181) currently declares: `refreshCadence`, `density`,
`responsiveness`, `offlinePolicy`, `permissionScope`, `stateManagement`, `persistence`, `auth`,
`attachments`, `budget`, `locale`, `outbox`, `platform`. **`brandSeedColor`, `brandFontFamily`,
`themeMode`, `roundness` do not exist.** `density` is the only theme-adjacent knob and it is parsed
(scoring.ts:43 `DENSITY` map, used at :74) but never reaches the theme. DESIGN_OPTS §0's "some
already parsed" = `density` (+ non-theme knobs); the theme knobs are all missing.

### 3.4 Generator source — validators (`builder/src/validate.ts`) + arch linter

- **No `[theme]` gate.** The gate set is `[headers] [secrets] [idioms] [arch] [oracle] [fidelity]
  [money] [datepicker] [verdict] [split] [symbols] [auth] [budget] [audit] [export] [l10n] [outbox]
  [platform] [shell] [search] [scroll] [actions] [plan-determinism]` (+ swift gates) — no theme.
- `archCheck` (validate.ts:39-70) has a **presentation-layer raw-color rule** at `:65`:
  `(?<![A-Za-z])Colors\.|(?<![A-Za-z])Color\(0x|(?<![A-Za-z])Color\.fromRGBO|(?<![A-Za-z])const Color\(`
  — but it applies **only to `features/<name>/presentation/` files**, has a negative lookbehind so
  `AppColors.x` passes, and does **not** cover `core/theme.dart`. It is a "no raw color in screens"
  rule, **not** a "forbid raw palette when a seed is declared" rule. DESIGN_OPTS §8's "arch-linter
  already forbids raw literals" is therefore only partially true.

### 3.5 Generator source — golden harness (`builder/src/generators/test.ts`)

`generateGoldenTest` (test.ts:177-184) wraps each screen in
`MaterialApp(theme: buildTheme(), home: <Screen>())` (bloc) / `ProviderScope(MaterialApp(theme:
buildTheme(), ...))` (riverpod), importing `core/theme.dart` directly. **There is no `*_dark`
branch and no `attributes.themeMode` check anywhere in test.ts** (grep `_dark|ThemeMode|themeMode`
= 0 hits in `builder/src` apart from the infra.ts comment).

### 3.6 Generator source — token drift (`builder/src/generators/components.ts`)

`AppTokens.primary = Color(0xFF006E6A)` (components.ts:191) ≠ `AppColors.primary = Color(0xFF0D9488)`
(infra.ts:201) — the DESIGN_OPTS §0 "Token drift" row is confirmed. `AppTokens` is **dead code**:
grep of `apps/*/output/app/lib` shows only the definition; screens/forms use
`AppColors.*`/`AppSpacing.*`/`AppRadius.*` directly (e.g. screen.ts:325, crud_form.ts:394).

### 3.7 Committed generated outputs (already in this repo — no regeneration)

- `apps/tasks/output/app/lib/main.dart:28` — `theme: ThemeData(colorSchemeSeed: Colors.teal),`
  (main.v1 bloc). Exactly DESIGN_OPTS's `main.dart:28`.
- `apps/hr_service/.../main.dart:36`, `apps/work_auth/.../main.dart:30` — same, main.v1.
- `apps/ledgerly/.../main.dart:40` — same, `main_multi.v1` (multi-feature).
- `apps/*/output/app/lib/core/theme.dart` — token system + `buildTheme()` only; matches the infra
  template verbatim; **no `buildThemeDark()`** in any committed app.
- `apps/tasks/output/app/test/golden_test.dart:29` and `scroll_test.dart:83,99` — screens wrapped in
  `MaterialApp(theme: buildTheme())` (the "goldens hide it" claim, confirmed in committed output).
- `apps/tasks/output/app/test/widget_test.dart` pumps `ReplicaApp()` and asserts a `Scaffold` exists
  (generator `project.ts:325-341`) — the only committed test that exercises `main.dart`'s theme.
- **No sample/app IR sets `themeMode`, `brandSeedColor`, `brandFontFamily`, or `roundness`**
  (grep over `apps/*/input/*.ir.json` + `builder/samples/*.ir.json` = 0 hits; `density` also 0).
  All are default-absent today.

### 3.8 Seed-color note

`Colors.teal` = `Color(0xFF009688)`; `AppColors.primary` = `Color(0xFF0D9488`. The live app
currently renders the former; wiring `buildTheme()` flips the live seed to the latter — both teals,
a one-time live-app visual delta. **Goldens do not churn** (they already use `AppColors.primary`
via `buildTheme()`).

## 4. Questions

Per SPIKE_PROTOCOL §6, the brief's six questions, answered with source + committed-output evidence:

1. Is "theme is dead code in the running app" TRUE today?
2. What is the minimal deterministic emission — and does D1 also need `buildThemeDark()`?
3. Does `attributes.brandSeedColor` already exist, and is there a `[theme]`/arch raw-literal rule?
4. Do dark-mode goldens branch on `themeMode` today, and does the golden harness survive D1 as-is?
5. Does D1 require any IR/`types.ts` schema addition, and is it backward-compatible/deterministic?
6. Does anything in D1 touch `composition.ts`/`screen.ts` pattern-selection (the P1–P4 / P5-D2 surfaces)?

## 5. Evidence

- **Repository source:** `project.ts:127,135,192,223,233` (5 hardcoded teals), `infra.ts:192-253`
  (static theme template, no `buildThemeDark`, `_f` unused), `types.ts:156-181` (`AppAttributes`
  without brand/themeMode/roundness), `scoring.ts:43,74` (`density` parsed, unused for theme),
  `validate.ts` (gate list — no `[theme]`; `archCheck` presentation-only raw-color rule at :65),
  `test.ts:177-184` (golden harness wraps `buildTheme()`; no dark branch), `components.ts:188-192`
  (`AppTokens` drift, dead), `index.ts:121` (`theme.dart` emitted unconditionally).
- **Generated app (committed):** `apps/tasks/output/app/lib/main.dart:28`,
  `apps/hr_service/.../main.dart:36`, `apps/work_auth/.../main.dart:30`,
  `apps/ledgerly/.../main.dart:40` (teal hardcoded in main.v1 + main_multi.v1); all four
  `lib/core/theme.dart` = `buildTheme()` only; `golden_test.dart:29` + `scroll_test.dart:83,99`
  wrap screens in `buildTheme()`.
- **Sample IRs:** no sample sets any theme attribute (`brandSeedColor`/`themeMode`/`density`/
  `roundness` all absent) — so a default-teal fallback path is exercised by every current sample.
- **No runtime/golden/CDP evidence:** no Flutter SDK on this box; the compile/visual claims are
  argued statically from generated Dart (excluded in §10).

## 6. Semantic contract

The decision can be derived **deterministically from IR `attributes`** — no hidden heuristics:

- **Theme in the app root** ⇔ always emitted (unconditional `theme: buildTheme()`), independent of
  attributes. No semantic gate; it is the base contract of the app shell.
- **Dark mode** ⇔ `attributes.themeMode` present. Value maps 1:1 to `ThemeMode.{light|dark|system}`.
  Absent → `light` (today's always-light behavior, byte-for-byte behavior-compatible).
- **Brand seed** ⇔ `attributes.brandSeedColor` present (validate `^#?[0-9A-Fa-f]{6}$`). Maps 1:1 to
  the `AppColors.primary` hex literal. Absent → `0xFF0D9488` (today's token teal).
- **Dark goldens** ⇔ `themeMode == "dark"` (per DESIGN_OPTS O1.3) — deterministic boolean; absent/
  light/system → no `*_dark.png` case emitted → existing light goldens don't churn.
- **`brandFontFamily`** ⇔ optional companion to `brandSeedColor` (design decision: fold into D1c or
  defer with O1.2's full scope).

## 7. Determinism analysis

- **Inputs:** IR `attributes.{themeMode, brandSeedColor}` (optional) + the deterministic static
  templates. No variable external input, no filesystem-order dependence, no time/randomness.
- **Selector home:** the interpolation lives in the **template emitter** — `project.ts`
  (`theme:`/`darkTheme:`/`themeMode:`) and `infra.ts` (`AppColors.primary` hex) — both pure
  `(FeatureModel) → string`. No new selector module needed; `scoring.ts`/`composition.ts` are
  untouched (theme is not an architecture/composition decision — it is presentation data).
- **Byte-identical backward-compat:** for any IR that does not set the new attributes, the ONLY
  diff vs pre-D1 output is the fixed wiring lines in `main.dart` (`import 'core/theme.dart';`,
  `theme: buildTheme(),` [D1a]; `darkTheme: buildThemeDark(), themeMode: ThemeMode.light,` [D1b]).
  `core/theme.dart` is unchanged for D1a (byte-identical), gains the additive `buildThemeDark()`
  block for D1b. No golden churn: goldens already render through `buildTheme()` and no sample sets
  `themeMode: dark`.
- **Emission shape:** one template shape per branch (uniform `themeMode: ThemeMode.${mode}` with a
  `light` default) is preferred over conditional-omit — identical-string-deterministic and simpler
  to gate. A `[theme]` re-derive gate (mirroring `[search]`/`[scroll]`/`[actions]`) then asserts
  `main.dart` really contains the wiring and that no `ThemeData(colorSchemeSeed: Colors.teal)`
  literal survived.

## 8. Ownership analysis

- **D1a (O1.1 wire + drift fold-in):** `project.ts` (`generateMain` + `generateMultiMain`, all 4
  router branches + demo shell) is the sole owner of `main.dart`. `components.ts` owns the
  `AppTokens` literal (one-line align). `validate.ts` owns the new `[theme]` gate. **No new
  module.**
- **D1b (O1.3 dark):** `infra.ts` owns the additive `buildThemeDark()` block; `project.ts` owns the
  `darkTheme:`/`themeMode:` lines; `types.ts` owns the `themeMode` field; `test.ts` owns the
  dark-golden branch.
- **D1c (O1.2 brand seed):** `types.ts` owns the `brandSeedColor`/`brandFontFamily` fields;
  `infra.ts` owns the seed interpolation; `validate.ts` extends `[theme]`.
- **Shared-generator rule:** every touch **extends** an existing template; nothing is forked.
- **Question 6 answer (ownership conflict):** D1 touches `project.ts`/`infra.ts`/`test.ts`/
  `types.ts`/`validate.ts` — **nothing** in `composition.ts`/`screen.ts` pattern-selection.
  Confirmed no conflict with P1–P4 (shell/search/scroll/actions) or the P5-D2 placement slices;
  D1 can land and be verified independently (flutter analyze + light goldens) before D2.

## 9. Failure modes (each has a deterministic outcome)

| Condition | Outcome |
|---|---|
| `themeMode` absent | Emit `themeMode: ThemeMode.light` + `darkTheme: buildThemeDark()` (behavior = today: always light). No dark goldens. |
| `themeMode` invalid value | IR schema check / `[theme]` gate error (closed vocabulary light\|dark\|system) — hard error, never a silent fallback. |
| `brandSeedColor` absent | Default hex `0xFF0D9488` interpolated — byte-identical to today's `theme.dart`. |
| `brandSeedColor` malformed (bad hex) | Deterministic fallback to default teal **and** `[theme]` gate flags the malformed hex (generation never aborts for a cosmetic attr; validation is the gate). |
| `themeMode == dark` (sample) | Golden test emits the `*_dark.png` case with `themeMode: ThemeMode.dark` — dark goldens appear; existing light goldens untouched. |
| `themeMode == light/system` | No `*_dark.png` case → existing goldens don't churn. |
| No `[theme]` validator (pre-D1) | D1a adds a minimal wiring gate (re-derive + scan); the forbid-raw-palette-when-seed check ships with D1c, not D1a. |
| No screens app (demo shell) | Same wiring applied for uniformity (theme.dart is emitted unconditionally by index.ts:121, so the import is safe). |

## 10. Architecture impact

Classification **A (pure presentation)**, plus a trivial **C-lite data plumb** (two optional
`attributes` fields → template interpolation). It does **not** cross into navigation (D) or runtime
authorization (E). Dark mode is presentation state selected by `themeMode` at the widget root, not
a data-flow change. `themeMode: system` deliberately follows the OS (no runtime wiring needed — it
is a single `ThemeData` selection by the framework). This is honestly cosmetic-to-presentation; it
is still the single highest-leverage presentation fix because it is the difference between "the
design renders" and "the design is dead" (§12.1).

Dimensions tested: N/A — no Flutter SDK on this box. Exclusions: no goldens, no CDP, no
320/390/768/1280 sweep, no light/dark runtime check. All are planned in §14's matrix. The
compile-correctness and byte-compat claims are argued statically from template + emitted source.

## 11. Cost/complexity

- **Generator:** D1a S (replace 5 literals, 1 import, 1 literal align, ~30-line gate); D1b S–M
  (add `buildThemeDark()` block + 1 field + 2 template lines + golden branch); D1c S–M (1–2 fields +
  seed interpolation + optional tone-derivation helper + gate extension).
- **IR/schema change:** D1a **none**; D1b `themeMode?`; D1c `brandSeedColor?`/`brandFontFamily?` —
  all optional, backward-compatible (absent = today's bytes).
- **Runtime:** S — all widgets are stock Flutter (`ThemeMode`, `ThemeData.dark`).
- **Testing:** M — the one-time byte-diff proof (5 wiring lines per sample), `[theme]` re-derive
  gate, no-golden-churn proof, then Mac-side goldens + CDP.
- **Determinism risk:** Low (pure template interpolation from optional IR fields).
- **Benefit worth the cost:** **yes** — this converts a shipped-but-dead design system into the
  running app's actual look and is the stated D2 prerequisite (SPIKE_PLAN §P5).

## 12. Findings

1. **The hypothesis's core claim is TRUE.** Every committed app root hardcodes
   `ThemeData(colorSchemeSeed: Colors.teal)` (tasks:28, hr_service:36, work_auth:30, ledgerly:40);
   `buildTheme()` is never wired; goldens/scroll tests hide it by wrapping screens in `buildTheme()`
   themselves. The live app loses scaffold tint (0xFFF8FAFC), card radius 16, filled inputs, bundled
   Roboto, and the M3 seed-derived scheme. (Partial nuance: screens reference the static
   `AppColors.*`/`AppSpacing.*`/`AppRadius.*` consts directly — e.g. screen.ts:325 — so *some*
   tokens reach widgets; the *theme-level* system is dead.)
2. **`buildThemeDark()` does not exist** (infra.ts is light-only + a comment). O1.3 cannot ride on
   existing code — D1b must add it (additive, deterministic mirror).
3. **`attributes.brandSeedColor`/`brandFontFamily`/`themeMode`/`roundness` do not exist** in
   `AppAttributes`; only `density` is parsed (and unused for the theme). O1.2/O1.3 legitimately
   need backward-compatible optional fields — this is exactly the DESIGN_OPTS §8.1 "explicit IR
   over inference" contract, and the P5-D2 "no IR changes" principle applies to **D2**, not D1.
4. **No `[theme]` gate and no seed-vs-palette validator exists.** The arch-linter's raw-color rule
   is presentation-layer-only and not a forbid-palette-when-seed rule.
5. **No dark-golden branch exists** (test.ts wraps screens in light `buildTheme()` only). The
   golden harness **survives D1 unchanged** — it pumps screens directly, never `ReplicaApp`, so
   `main.dart` wiring is invisible to it (byte-identical, no compat risk). Only `widget_test.dart`
   (pumps `ReplicaApp`) traverses the new wiring — and it only asserts a Scaffold.
6. **D1 is fully independent of the P1–P4/P5-D2 surfaces** (Q6: no `composition.ts`/`screen.ts`
   touch) — it can land and verify before D2.
7. **Packaging correction:** O1.1, O1.3, and O1.2 differ in schema surface (none / 1 field / 1–2
   fields), module surface (project.ts / project.ts+infra.ts+test.ts / infra.ts+validate.ts), and
   design surface (none / dark palette values / seed-tone derivation). Each is independently
   byte-identical-safe and independently verifiable. Fusing all three into ONE slice is not
   "minimal": it couples the base wiring to two separate design decisions and muddies the
   byte-identical proof. DESIGN_OPTS line 65 itself orders them O1.1+O1.2-then-O1.3, and
   SPIKE_PLAN §P5 names dark mode in D1's scope — so a 3-sub-slice D1 (a: wire, b: dark, c: seed)
   honors both.

## 13. Decision

**MODIFY.** The hypothesis's wiring claim is proven correct (theme is genuinely dead in the running
app; wiring it is small, deterministic, byte-identical-safe, and prerequisite to D2). The
**one-slice (O1.1+O1.2+O1.3) packaging** is rejected as not-minimal: the evidence (§12.7) forces
splitting D1 into three independently-landable sub-slices, each byte-identical-safe:

- **D1a — wire `buildTheme()` + drift fold-in (O1.1).** No schema change. project.ts replaces the
  5 `ThemeData(colorSchemeSeed: Colors.teal)` literals with `theme: buildTheme(),` + adds
  `import 'core/theme.dart';`; components.ts aligns the dead `AppTokens.primary` literal to
  `AppColors.primary` (drift fix); validate.ts adds a minimal `[theme]` gate asserting the wiring
  (and forbidding the old teal literal).
- **D1b — dark mode (O1.3).** Adds `attributes.themeMode?: "light"|"dark"|"system"` (default
  `light`), the additive `buildThemeDark()` block in infra.ts, `darkTheme:`/`themeMode:` emission in
  project.ts, and the `*_dark.png` golden case in test.ts **only when `themeMode == "dark"`**.
- **D1c — brand seed (O1.2).** Adds `attributes.brandSeedColor?` (+ optional `brandFontFamily?`),
  seed interpolation into `AppColors.primary` in infra.ts (invalid hex → teal fallback + `[theme]`
  flag), and the forbid-raw-palette-when-seed-declared check. Full seed-derived semantic-tone
  derivation is a deliberate defer within O1.2 unless a sample needs it.

Recommended ordering: **D1a → D1b → D1c** (highest-leverage first; each lands + verifies before the
next; D2 may start after D1a in parallel with D1b/c since D2 only needs the tokens rendered).

## 14. Recommended implementation

### 14.1 Final semantic contract

```
themeMode  = attributes.themeMode           // "light" | "dark" | "system"; absent → "light"
seed       = attributes.brandSeedColor       // "#RRGGBB"; absent/malformed → "#0D9488"
AppColors.primary = Color(0xFF<seed>)
main.dart:  import 'core/theme.dart';
            theme: buildTheme(),
            darkTheme: buildThemeDark(),     // always emitted (uniform shape)
            themeMode: ThemeMode.<themeMode>,
dark golden ⇔ themeMode == "dark" (test.ts emits *_dark.png case)
[theme] gate: main.dart must contain `theme: buildTheme()` and must not contain
            `ThemeData(colorSchemeSeed: Colors.teal)`; if seed declared, theme.dart primary hex must
            equal the seed; dark goldens present ⇔ themeMode == "dark".
```

### 14.2 Sub-slices

- **D1a (O1.1 + drift fold-in):**
  1. `project.ts` — replace the 5 `theme: ThemeData(colorSchemeSeed: Colors.teal),` lines
     (`:127,135,192,223,233`) with `theme: buildTheme(),`; add `import 'core/theme.dart';` to the
     import block (fixed position, deterministic; the locale-aware path already imports
     `core/app_strings.dart` — place the theme import on its own constant line).
  2. `components.ts:191` — `AppTokens.primary = Color(0xFF006E6A)` → `AppTokens.primary =
     AppColors.primary` (components.dart already imports `theme.dart`, so this is valid Dart and
     kills the drift at the source; keep the class, never delete).
  3. `validate.ts` — `[theme]` gate: scan `main.dart` for `theme: buildTheme(),` (required) and for
     `ThemeData(colorSchemeSeed: Colors.teal)` (forbidden — regression guard against the literal
     reappearing); re-derive posture like `[search]`/`[scroll]`.
  4. Verify: typecheck; regenerate all samples + apps; validate PASS; `flutter analyze` (Mac);
     **light goldens unchanged** (they already render `buildTheme()`); `widget_test` still green.
- **D1b (O1.3 dark):**
  1. `types.ts` — add `themeMode?: "light" | "dark" | "system";` to `AppAttributes`.
  2. `infra.ts` — append `buildThemeDark()` to the theme template: mirror of `buildTheme()`
     (`Brightness.dark`, same seed/radius/spacing/fontFamily, dark scaffold background +
     tinted fill, `cardTheme`/`inputDecorationTheme` identical shape) — additive, deterministic.
  3. `project.ts` — router branches (+ demo shell) emit `darkTheme: buildThemeDark(),
     themeMode: ThemeMode.${themeMode}` after `theme: buildTheme(),`. Absent → `ThemeMode.light`.
  4. `test.ts` — when `attributes.themeMode == "dark"`, emit a second golden case
     `MaterialApp(theme: buildTheme(), darkTheme: buildThemeDark(), themeMode: ThemeMode.dark,
     home: <Screen>())` → `goldens/<name>_dark.png`.
  5. `validate.ts` — extend `[theme]`: `themeMode` set ⇒ `main.dart` contains the `darkTheme:`/
     `themeMode:` lines; `themeMode == "dark"` ⇒ the `*_dark` golden test exists.
  6. Verify: typecheck; all samples byte-identical except the 2 wiring lines added in D1a's wake;
     no sample sets dark → **no golden churn**; add one scratch IR with `themeMode: dark` on the Mac
     to produce `*_dark.png` + run `flutter analyze`.
- **D1c (O1.2 brand seed):**
  1. `types.ts` — add `brandSeedColor?: string;` (+ optional `brandFontFamily?: string;`).
  2. `infra.ts` — interpolate the sanitized seed into `AppColors.primary = Color(0xFF<seed>)`
     (default `0D9488`); malformed hex → fallback + `[theme]` flag. Optional within O1.2: a tiny
     pure-Dart tone-derivation helper replacing the static semantic literals — **defer** unless a
     sample needs it (static literals keep D1c byte-compatible).
  3. `validate.ts` — `[theme]` forbid-raw-palette-when-seed-declared + hex validity + seed/emitted
     equality.
  4. Verify: an IR with `brandSeedColor` → `theme.dart` primary reflects the seed; existing samples
     byte-identical (all absent).

### 14.3 Test / golden / verify matrix

- `npm run typecheck:builder` after each sub-slice.
- Regenerate all samples + apps (`tasks`, `hr_service`, `ledgerly`, `work_auth`, rasheed, todo,
  promo, inventory, wizard, reimbursement, ...) then `validate.ts` — **one-time `main.dart` diff =
  the 3 wiring lines only** (byte-identical proof).
- `[theme]` gate PASS on all; negative control (a regenerated pre-D1 `main.dart` with the teal
  literal) → FAIL.
- Mac: `flutter analyze && flutter test --update-goldens` — light goldens unchanged; `*_dark.png`
  only for a `themeMode: dark` sample; `widget_test` green.
- CDP probe on the tasks app (320/390/768/1280): real shell now renders the token design
  (scaffold tint, filled inputs, Roboto); if a dark sample is added, verify `ThemeMode.dark` flips
  surfaces with no overflow. This is the D1 → D2 handshake gate (SPIKE_PLAN §P5 acceptance).

## 15. Rejected alternatives

- **ADOPT as written (O1.1+O1.2+O1.3 in one D1 slice):** rejected — couples base wiring to two
  separate design decisions (dark palette, seed-tone derivation) and muddies the byte-identical
  proof; each option is independently byte-identical-safe and verifiable (§12.7), so one slice
  buys nothing.
- **Full O1.2 seed-tone derivation in D1c now:** rejected for the slice — static semantic literals
  keep D1c minimal and byte-compatible; the pure-Dart tone helper is additive and can land when a
  sample actually brands (defer with evidence, per SPIKE_PROTOCOL §14).
- **`themeMode` default = `system`:** rejected — silently changes existing apps' behavior on dark
  OSes (a live-app visual churn the brief's byte-identical contract forbids). Default `light`
  preserves today's behavior exactly; a sample can opt into `system` explicitly.
- **Emit `darkTheme:`/`themeMode:` only when the attribute is set (conditional omit):** rejected —
  two template shapes to gate for zero benefit; the uniform single-shape with a `light` default is
  simpler to gate and equally deterministic.
- **Fix the drift by deleting `AppTokens`:** rejected — AGENTS rule 1 (never delete); align the
  literal to `AppColors.primary` instead.
- **`[theme]` gate carrying the forbid-raw-palette check in D1a:** rejected — that check only
  means something once a seed exists (D1c); D1a's gate is the wiring + no-teal-literal assertion.

## 16. Open questions

- Dark palette **values** for `buildThemeDark()` (scaffold/fill hexes) — a design call the D1b
  implementer must pin before emitting (deterministic either way once chosen).
- Should the demo-shell (no-screens) branch of `main.v1` be wired too, or left on the default
  theme? (Recommend yes for uniformity; it is one line and `theme.dart` is always emitted.)
- D1c scope: does the owner want the optional seed-derived semantic-tone helper now, or static
  literals + seed-primary only? (Recommend the latter; defer the helper.)
- Does D2's empty/error/loading richness want the **dark** rendering verified via CDP in D1's
  acceptance, or is light-only verification enough until D2 lands?
- `[theme]` gate severity: error (matches `[search]`/`[scroll]`/`[actions]`) — confirm.

## 17. Follow-up

- Report **MODIFY** + key evidence to the orchestrator (Telegram/opencode return): theme is dead in
  the running app (5 teal literals, all committed apps), `buildThemeDark()`/`themeMode`/
  `brandSeedColor`/`[theme]` gate all absent, golden harness survives D1 as-is, no
  composition/screen ownership conflict; decision = MODIFY packaging into D1a/D1b/D1c.
- Capture an implementation brief for the executor (Claude first; remote opencode channel fallback)
  for **D1a** (project.ts 5-literal swap + drift align + `[theme]` gate) — it is the highest-leverage
  independent landing.
- After D1a lands + verifies, brief D1b (dark) then D1c (seed). Keep each its own commit
  (AGENTS rule 2) and its own Telegram note + golden set (rule 9/10).
- This report is saved under `design/flutter-app-builder/research/` (research archive; brief allowed
  it here once synced).
