# Payment Pilot Integration Note

Date: 2026-06-25

## Implemented

- `Failure`, `Order`, `ConfirmPaymentRequest`, `PaymentRepository`, `PaymentRepositoryImpl`, and `ConfirmPaymentUseCase` were added to the repo.
- `lib/app/app_action_dispatcher.dart` was patched manually to handle `payment.confirmOrder`.
- The current generated Payment screen now flows through:
  - `AppActionDispatcher.dispatch(screenId: 'payment', actionId: 'confirmOrder')`
  - `_paymentConfirmOrder`
  - `ConfirmPaymentUseCase`
  - `PaymentRepositoryImpl`
  - `context.goNamed('order_details')`

## Verified

- `flutter pub get`
- `dart format lib test`
- `flutter analyze`
- `flutter test test/features/payment/payment_domain_test.dart`
- Package name is `fahs`.
- `order_details` exists in `lib/generated/app/router.g.dart`.
- The generated Payment screen dispatches:
  - `screenId: 'payment'`
  - `actionId: 'confirmOrder'`
  - `fallbackRouteName: 'order_details'`

## Limitations

- The payment handler is still a pilot stub.
- `inspectionId` is hardcoded as `inspection-current-repo-pilot`.
- `paymentMethod` is hardcoded as `mada`.
- `PaymentRepositoryImpl` is fake and does not call a real API.
- No Bloc is connected yet.
- No DI is connected yet.
- No Payment UI rewrite was done.
- No success listener exists outside the dispatcher route call.
- No Payment widget or golden tests were added yet.
- `dart format lib test` also reformatted unrelated generated files and those diffs should be reviewed separately if needed.

## Roadmap

- Clean the diff so only the intended payment pilot files and dispatcher/pubspec changes remain.
- Map Payment into the current `specs/product/screens` and `specs/ui/screens` structure.
- Add generator support for the current-schema Payment specs.
- Add Bloc only after the current-schema Payment mapping is stable.
- Add DI and real API integration after the domain flow is proven.

## Next Step

- Keep the merge minimal and commit only the intended payment pilot changes.
- Then start the next small step: current-schema product/UI spec mapping for Payment, not Bloc yet.
