# FAHS Flutter Generator

This repository turns an HTML prototype into spec-driven Flutter screens.

## Source Of Truth

The HTML prototype is the starting point.

Pipeline:

1. HTML prototype
2. `tools/import_prototype_html.ts`
3. Product / Design / UI specs
4. Validation
5. `tools/generate_flutter.ts`
6. Generated Flutter screens

Do not hardcode screen-specific logic into the generator. Keep the generator generic and let the specs describe the UI.

## Typical Workflow

### 1. Import the prototype

```bash
npm run import:prototype
```

This reads `fahs_flutter_like_prototype_v2.html`, extracts evidence, and refines the UI specs.

### 2. Validate specs

```bash
npx ts-node tools/specs/validate.ts
```

Use this to catch invalid or inconsistent specs before code generation.

### 3. Generate Flutter

```bash
npm run generate:screens
npx ts-node tools/generate_router.ts
```

The generator should only read refined specs. It should not infer prototype-specific behavior from screen names.

### 4. Verify generated output

```bash
npm test
flutter analyze
flutter test
```

Run these after regeneration to make sure the code compiles and the widget tests still pass.

## Visual Evidence

Golden screenshots are useful evidence while the HTML-to-Flutter renderer matures:

```bash
npm run golden:payment:update
npm run golden:remaining:update
```

Prototype screen HTML can also be extracted from the binding map:

```bash
npm run prototype:extract:screens
```

Pixel-by-pixel prototype-versus-golden comparison is intentionally disabled in the default workflow. The current generator still has known maturity gaps around icon assets, RTL internal slots, spacing, and component mapping, so pixel drift is not yet a reliable quality gate.

Default commands record the disabled status and exit successfully:

```bash
npm run compare:payment
npm run compare:all
```

Use strict comparison only when the visual pipeline is mature enough to make pixel drift meaningful:

```bash
npm run compare:payment:strict
npm run compare:all:strict
```

Do not update baselines or loosen thresholds to hide structural issues. Fix shared component mappings first, then re-enable strict comparison as a deliberate decision.

## What The Importer May Update

Safe updates only:

- `sourceEvidence`
- `renderEvidence`
- `repeatCount`
- `trailingLabel`
- layout and display hints
- visible text samples
- selector anchors

Do not use rendered HTML to modify:

- Product actions
- navigation rules
- business rules
- Flutter widget names
- raw hex colors

## Rollback-Safe Commits

Keep changes small and reversible.

Recommended slices:

1. Test harness changes, such as font bootstrap for goldens
2. Layout/alignment fixes in shared widgets
3. Compare/test workflow changes

This makes it easy to revert one slice without losing the others.

## When The Screenshot Is Wrong

If golden output shows squares instead of Arabic text:

- check the test font bootstrap in `flutter_test_config.dart`
- verify the font asset exists in `assets/fonts`
- rerun the golden update

If the screenshot is readable but the layout is off:

- fix the shared design-system widget first
- regenerate the golden
- compare again

## Useful Files

- `tools/import_prototype_html.ts`
- `tools/generate_flutter.ts`
- `tools/generate_router.ts`
- `tools/compare_payment_golden.py`
- `flutter_test_config.dart`
- `test/goldens/payment_screen_golden_test.dart`
