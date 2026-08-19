# RCA-001 — kids_quiz wizard "Player Name": iOS Safari keyboard still silent despite focus-bypass

**Finders:** owner (live iPhone testing), 2026-08-19
**Lane:** zen orchestrator diagnosis → hardening brief dispatched
**App:** `apps/kids_quiz` (`QuizRunWizardScreen`, intro step)
**Severity:** p1 — the quiz can't be started on iPhone (name is required to advance)
**State:** UNDER INVESTIGATION — fix present but NOT effective; NOT closed

## 1. Symptom

Owner, iPhone Safari, live `/kids_quiz`: taps the wizard "Player Name" field on the quiz intro
step; the on-screen keyboard never opens, so the name can't be typed and the run can't start. This
is "the same iPhone input problem" as keemart's search (RCA-002) and the CRUD forms (RCA-005).

## 2. Investigation

- **Served build is current.** `main.dart.js` served via tailnet == local v1.1 build (bytes
  identical, 3,103,574). The field emitter is present.
- **The proven bypass IS on the field** (`quiz_run_wizard_screen.dart:60`):
  `TextFormField(key: ValueKey('field-playerName'), focusNode: _playerNameFocus,
  onTap: () => _playerNameFocus.requestFocus(), initialValue: ..., onChanged: ...)` — structurally
  identical to the CRUD-form emission that works (crud_form.ts:111:
  `focusNode: _${f.name}Focus, onTap: () => _${f.name}Focus.requestFocus()`).
- **Structural difference vs the proven path** (prime suspect):
  - CRUD form: `TextField(controller: _x, focusNode + onTap requestFocus)` at the top of a plain
    `ListView`/form body — controller-backed.
  - Wizard: `TextFormField(...initialValue: ...)` **controller-less**, nested inside
    `Expanded → SingleChildScrollView → switch (state.currentStep) → Column → TextFormField`
    (wizard step body got its own `SingleChildScrollView` from the earlier wizard-overflow fix,
    `019377b`). The field is a leaf of a `switch` that rebuilds on every step transition.
- **Test gap:** work_auth's `wizard_focus_test.dart` asserts the ON TAP + FocusNode are EMITTED
  (structural), not that iOS WebKit actually pops a keyboard from a real tap inside a scroll view.
  Passing that test does NOT prove iPhone behaviour. CDP (desktop Chromium) cannot reproduce iOS
  WebKit's keyboard-suppression policy either — documented limitation in RCA-002 §6.
- No console/network errors and no overflow on desktop probe; the failure is iOS-Safari-specific
  keyboard-suppression, not a Dart exception.

## 3. Root cause (working hypothesis — NOT yet proven)

Two candidate mechanisms, both distinct from the CRUD-form case:

1. **Scroll-view gesture arbitration:** the field sits inside `SingleChildScrollView`. On iOS
   Safari, the first tap is consumed by the scroll view's own gesture recognizers (potential
   scroll detection), so the `TextFormField.onTap`/focus `requestFocus` doesn't fire in a way
   iOS treats as a "user gesture that opens the keyboard" — the keyboard stays suppressed.
   The CRUD-form file path never had a wrapping scroll view doing first-tap arbitration at the
   field, which is why that fix landed there.
2. **Controller-less `TextFormField` + `initialValue` + step-`switch` rebuild:** the input's DOM
   `<input>` proxy lifecycle is tied to the step `switch`; on iOS the lazy-proxy-first-tap path
   (RCA-002/005 mechanism) is re-entered on the wizard, and the single `onTap` requestFocus isn't
   sufficient to create + focus the proxy in one synchronous gesture.

Both need real-iOS confirmation. Neither can be reproduced in desktop CDP.

## 4. Proposed hardening (generator-side, pending owner OK to dispatch)

Dispatch a hardening brief that, without assuming which hypothesis is correct, makes the wizard
text-input emit as robust to iOS as the CRUD field:

- **Controller-backed + explicit focus in the wizard path too** (align with crud_form): give the
  wizard's text step fields `TextEditingController` + FocusNode + gesture-bound
  `onTap: requestFocus`, plus a **whole-field `GestureDetector(behavior: opaque)`** wrapper so the
  tap is not consumed by the scroll recognizer before the field handler runs — the standard,
  proven iOS-Safari + scroll-view fix.
- Keep `autofocus` off (proven to make it worse, RCA-005).
- Do NOT change ChoiceChip answer fields (they're non-text, unaffected).
- Regression guards: strengthen the wizard-focus generation test to also assert the
  `GestureDetector`/opaque wrapper + controller, so a revert fails the suite.
- Since ios Safari keyboard can't be verified in CDP, ship + ask owner to re-test on iPhone; record
  outcome in this RCA (open → closed or iterate).

## 5. Logic / rationale

- The CRUD-form fix is the only mechanism proven working on a real iPhone in this repo; the wizard
  field must emit *at least* that, plus eliminate the scroll-view tap-arbitration variable
  (hypothesis 1) and align the controller lifecycle (hypothesis 2). Wrapping the field in an
  opaque tap `GestureDetector` forces the field to win gesture arbitration — the canonical fix for
  `ListView`/`ScrollView` + text-input + iOS keyboard.
- Keeping it generator-side (never hand-edit the generated app) preserves ownership.
- NOT closing this RCA as "fixed" because the fix is present: the owner's live report is the
  ground truth, and the existing mechanism provably isn't enough for this field's context.

## 6. Verification (after hardening lands)

```bash
npm run typecheck:builder
npm test                  # + strengthened wizard-focus guards
npx ts-node --transpile-only builder/src/validate.ts apps/kids_quiz/input/kids_quiz.ir.json apps/kids_quiz/output/app   # ALL gates
# regen kids_quiz; flutter analyze 0 errors; flutter test 52/52 (goldens)
# existing 5 apps byte-identical (wizard change is additive, aimed at the switch/scroll emitter)
# rebuild web /kids_quiz (server reads disk per request — no restart), re-serve
# CDP desktop regression: field focuses + types + run advances (desktop must not regress)
# OWNER re-test on iPhone: keyboard must open on tap in the intro step
```

## 7. Prevention

- Wizard text step-fields must emit the same controller + opaque-tap-wrapped focus bypass as the
  CRUD form as a DEFAULT, not a special case — one template, both archetypes.
- Documented limitation: Flutter-web keyboard-opening cannot be verified by CDP on desktop; a
  wizard or form with a real text input gets an explicit "re-test on iOS" step in every slice that
  touches it (add to the verification checklist).
