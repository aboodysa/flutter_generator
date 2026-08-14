# Payment Spec-Driven Generator Roadmap

Date: 2026-06-25

## Goal

Move Payment from a hardcoded flow to a spec-driven flow that fits the current repository pipeline.

Current flow:

```text
Generated PaymentScreen
→ AppActionDispatcher
→ ConfirmPaymentUseCase
→ Fake PaymentRepository
→ order_details
```

Target flow:

```text
Specs
→ Resolver
→ Generators
→ Generated runtime code
→ Tests
```

## Needed Files

### Documentation

- `artifacts/roadmap/2026-06-25-payment-pilot-integration-note.md`
- `artifacts/roadmap/2026-06-25-payment-spec-generator-roadmap.md`
- `artifacts/lessons-learned/2026-06-25-payment-pilot-lessons.md` optional

### Current-schema specs

- `specs/product/screens/payment.product.json`
- `specs/ui/screens/payment.ui.json`
- `specs/flows/payment.flow.json` later if the repo uses flow specs for routing

### Production specs

- `specs/models/confirm_payment_request.model.json`
- `specs/models/order.model.json`
- `specs/models/failure.model.json`
- `specs/repositories/payment.repository.json`
- `specs/usecases/confirm_payment.usecase.json`
- `specs/apis/payment.api.json` later

### Resolver

- Update the resolver to emit payment action metadata into `artifacts/reports/resolved-app-model.json`.
- Extract:
  - `screenId`
  - `actionId`
  - `handlerKey`
  - `type`
  - `useCase`
  - `requestModel`
  - `successRoute`

### Generators

- `tools/generators/action_dispatcher.generator.ts` first
- `tools/generators/model.generator.ts` next
- `tools/generators/repository.generator.ts` next
- `tools/generators/usecase.generator.ts` next
- `tools/generators/bloc.generator.ts` later
- `tools/generators/ui.generator.ts` later
- `tools/generators/di.generator.ts` later

### Tests

- `test/generators/action_dispatcher_generator_test.ts`
- `test/features/payment/payment_domain_test.dart`
- `test/features/payment/payment_dispatcher_test.dart` later
- `test/features/payment/payment_bloc_test.dart` later
- `test/features/payment/payment_widget_test.dart` later
- `test/goldens/payment_golden_test.dart` last

## Priority Order

1. Make `confirmOrder` spec-driven in the current schema.
2. Generate the action dispatcher from specs.
3. Generate models.
4. Generate repository and use case layers.
5. Add Bloc only after the lower layers are stable.
6. Add UI integration after Bloc is verified.
7. Add DI after UI integration is stable.
8. Add widget, navigation, and golden tests last.

## Non-Goals

- Do not add Bloc before the spec model is stable.
- Do not add DI before the runtime domain flow is proven.
- Do not add real API integration before the fake repository path passes tests.
- Do not treat the current pilot merge as a full generator implementation.
