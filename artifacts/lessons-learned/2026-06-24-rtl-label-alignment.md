# Lessons Learned: RTL Label Placement

Date: 2026-06-24

## Problem

Arabic labels and values were sometimes rendered on the wrong visual side in RTL screens. The symptom showed up most clearly in generated forms such as payment, phone input, and add balance screens.

The root cause was not a single widget bug. It was a mix of:

- generated screen code holding layout assumptions
- shared widgets using fixed slot order or fixed left/right logic
- reliance on global `Directionality` without checking nested rows and slots
- noisy pixel comparisons that obscured the real layout issue

## Solutions Tried

### 1. Patching generated screens directly

What we tried:

- changing individual generated screens to move labels or fields manually
- editing the output under `lib/generated/screens/*`

What failed:

- regeneration overwrote the change
- the fix only applied to one screen
- the same bug returned when new specs were generated

Why it failed:

- generated files are not a stable source of truth
- the bug lived in shared behavior, not in a single output file

### 2. Hardcoding screen-specific logic in the generator

What we tried:

- special cases in `tools/generate_flutter.ts`
- screen-name-specific branches
- prototype-specific fixes for payment and splash

What failed:

- the generator stopped being generic
- fixes were brittle and hard to extend
- every new spec risked needing another one-off branch

Why it failed:

- the generator must stay spec-driven
- screen behavior belongs in specs or shared components, not in per-screen generator logic

### 3. Relying on `MaterialApp` Directionality only

What we tried:

- setting the app locale to Arabic
- wrapping the app with `Directionality(textDirection: TextDirection.rtl)`

What failed:

- some internal slots still rendered in the wrong order
- prefix/suffix, radio positions, and row children could still be visually reversed

Why it failed:

- global RTL direction is necessary, but not sufficient
- nested widgets still need directional slot handling

### 4. Switching everything to `AlignmentDirectional.centerStart` and `TextAlign.start`

What we tried:

- changing labels across shared components to directional-start alignment
- replacing fixed `right` text alignment in multiple widgets

What worked:

- it fixed a large class of Arabic alignment issues in reusable shared widgets
- it made regenerated screens follow RTL more consistently

What did not fully solve:

- widgets with internal slots still needed explicit slot order logic
- some cases required keeping the field shell RTL while preserving LTR content inside it, such as phone numbers

Why it worked partially:

- alignment and text direction became direction-aware instead of hardcoded
- the shared design system began to carry the RTL policy instead of individual screens

### 5. Comparing pixels before layout semantics were stable

What we tried:

- prototype-versus-golden pixel comparison
- screenshot diffing as the main validation gate

What failed:

- diffs were noisy when fonts, status bar capture, viewport region, or slot ordering were still changing
- the comparison encouraged threshold tuning instead of fixing the component model

Why it failed:

- pixel comparison is a downstream signal
- it is not a substitute for correct specs, correct component mappings, and stable shared widgets

## What Worked

### Permanent fix pattern

The stable solution was:

- keep generated screens UI-only
- move navigation and validation logic into a shared dispatcher or feature layer
- keep RTL behavior inside shared components
- use directional APIs where the component is supposed to adapt to RTL
- use explicit slot semantics where the component has leading/trailing content
- add widget tests for the shared widgets in RTL
- regenerate screens after the shared fix, not before

### Concrete examples

- `AppTextField` and `AppPhoneField` now handle label and internal slot placement in the shared layer.
- `PaymentMethodList` handles radio/icon/balance ordering in one place.
- `AppActionDispatcher` keeps generated screens from owning navigation logic.
- tests verify the behavior after regeneration.

## How To Handle Similar Problems

When Arabic or RTL text appears on the wrong side:

1. Identify whether the bug is in the generated screen, the spec, or the shared component.
2. Fix the shared component first if the problem repeats across screens.
3. Use `AlignmentDirectional`, `EdgeInsetsDirectional`, `TextAlign.start`, and `Directionality.of(context)` where the layout should adapt to locale direction.
4. Use explicit slot ordering for mixed-content rows, such as prefix/suffix, radio/icon rows, and action buttons.
5. Avoid screen-specific generator branches unless the behavior is genuinely screen-specific and data-driven.
6. Add widget tests that pump the component in `TextDirection.rtl` and confirm the slot order and text placement.
7. Regenerate the screens after the shared fix to confirm the issue is gone across all specs.
8. Treat pixel diffs as confirmation, not as the primary fix mechanism.

## Rule Of Thumb

If a layout bug returns after regeneration, the fix is in the shared component model or generator contract, not in the generated screen.
