# FAHS Tool Usage Guide

Date: 2026-06-24

## What This Tool Does

This repository turns an HTML prototype into spec-driven Flutter output.

Pipeline:

1. HTML prototype
2. Importer
3. Product / Design / UI specs
4. Validation
5. Generator pipeline
6. Generated Flutter screens and router

The generator is generic and spec-driven. Do not add screen-specific logic directly into generated files.

## Main Commands

### Import the HTML prototype

```bash
npm run import:prototype
```

Use this when the HTML prototype changes and the UI specs need to be refreshed.

### Generate Flutter from specs

```bash
npm run generate:pipeline
```

This is the main generation entrypoint. It runs the enabled artifacts from the config.

### Generate from HTML in one flow

```bash
npm run generate:from-html
```

This runs the importer first, then the pipeline.

### Validate specs

```bash
npx ts-node tools/specs/validate.ts
```

Use this before generation if you want to catch spec issues early.

### Verify generated Dart

```bash
npm run verify:generated
```

Use this to check generated files for forbidden patterns and missing imports.

### Run architecture compliance checks

```bash
npm run guard:architecture
```

Use this to catch:

- direct navigation leaking into generated screens
- Flutter names leaking into specs
- unsupported component patterns
- other architecture violations

### Run Flutter checks

```bash
flutter analyze
flutter test
```

Use these after generation to confirm the Flutter app still compiles and the widget tests pass.

## Optional Artifact Selection

You can choose which generators run with the pipeline:

```bash
npm run generate:pipeline -- --artifacts ui
npm run generate:pipeline -- --artifacts ui,router
```

The default config keeps `ui` and `router` enabled for FAHS.

## Visual Inspection

If you want to inspect the app manually:

```bash
flutter run -d chrome
```

Use this for visual review only. Do not treat browser screenshots as the primary contract for generation.

## What To Avoid

- Do not edit files under `lib/generated/screens` by hand.
- Do not add screen-specific hardcoded logic to the generator.
- Do not use raw hex colors in UI specs.
- Do not add Flutter widget names to specs.
- Do not weaken architecture or verification guards to make failures disappear.

## Recommended Daily Workflow

1. Update or import the prototype.
2. Validate specs.
3. Run the pipeline.
4. Verify generated Dart.
5. Run Flutter analyze and tests.
6. Inspect visually only if needed.

## Payment Pilot Merge Status

### Implemented

- Added `Failure`, `Order`, `ConfirmPaymentRequest`, `PaymentRepository`, `PaymentRepositoryImpl`, and `ConfirmPaymentUseCase`.
- Patched `lib/app/app_action_dispatcher.dart` manually to handle `payment.confirmOrder`.
- Wired the current generated Payment screen to the fake payment flow.

### Verified

- `flutter pub get`
- `dart format lib test`
- `flutter analyze`
- `flutter test test/features/payment/payment_domain_test.dart`
- Package name is `fahs`.
- `order_details` exists in `lib/generated/app/router.g.dart`.
- Generated Payment screen dispatches `screenId: 'payment'`, `actionId: 'confirmOrder'`, and `fallbackRouteName: 'order_details'`.

### Limitations

- The payment handler is still a pilot stub.
- `inspectionId` is hardcoded.
- `paymentMethod` is hardcoded.
- `PaymentRepositoryImpl` is fake and does not call a real API.
- No Bloc is connected yet.
- No DI is connected yet.
- No Payment UI rewrite was done.
- No success listener exists outside the dispatcher route call.
- No Payment widget or golden tests were added yet.
- `dart format lib test` also reformatted unrelated generated files and should be reviewed separately if needed.

### Roadmap

- Clean the diff so only the intended payment pilot files and dispatcher/pubspec changes remain.
- Map Payment into the current product/UI spec structure.
- Add Bloc only after the current-schema payment mapping is stable.
- Add DI and real API integration after the domain flow is proven.

### Next Step

- Keep this merge minimal, review the diff, and commit only the intended payment pilot changes.
- Then start the next small step: current-schema product/UI spec mapping for Payment, not Bloc yet.

## Troubleshooting

- If generated output changes unexpectedly, inspect the UI spec first.
- If an RTL label is misplaced, fix the shared widget or component mapping, not the generated screen.
- If generation fails on an unsupported component, add the component binding and a test before regenerating.
