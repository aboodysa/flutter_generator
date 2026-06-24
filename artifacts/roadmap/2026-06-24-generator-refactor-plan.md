# Generator Refactor Plan

Date: 2026-06-24

## Goal

Refactor the current code generation flow into a maintainable, spec-driven pipeline without changing the current FAHS output contract unless explicitly approved.

## Constraints

- Keep the generator generic.
- Keep generated screens UI-only.
- Keep navigation and business logic out of generated UI files.
- Preserve current screen output while refactoring internals.
- Add new capabilities only when source specs exist for them.

## Phase 1: Freeze The Contract

Tasks:

- Keep current CLI entrypoints working.
- Keep current generated Dart paths and filenames stable.
- Preserve current golden and widget tests.
- Add or update guards before splitting code into modules.

Exit criteria:

- `npm test` passes.
- `flutter analyze` passes.
- `flutter test` passes.
- `npm run verify:generated` passes.

## Phase 2: Extract Pipeline Core

Tasks:

- Introduce a generation context type.
- Introduce a generator interface.
- Move orchestration into a pipeline module.
- Keep file writing and output paths identical.

Exit criteria:

- The pipeline can run the existing UI and router outputs.
- No generated file content changes unless the refactor intentionally fixes a bug.

## Phase 3: Split Generators

Tasks:

- Extract UI generation into a dedicated UI generator.
- Keep router generation in a separate generator.
- Move shared helpers into smaller modules.

Exit criteria:

- `ui` and `router` can be run independently.
- The pipeline can fail fast when a requested artifact has no registered generator.

## Phase 4: Add Config-Driven Artifacts

Tasks:

- Add config or CLI toggles for enabled artifacts.
- Keep defaults aligned with current FAHS behavior.
- Document which artifacts are supported now versus later.

Exit criteria:

- Users can choose `ui` and `router` without changing code.
- Unsupported artifacts are rejected clearly.

## Phase 5: Expand Only After Specs Exist

Tasks:

- Add models, repositories, use cases, BLoC, DI, and tests only when corresponding specs exist.
- Add one generator at a time.

Exit criteria:

- Each new artifact has specs, generator code, and tests.
- No placeholder output is accepted as finished work.

## Regression Safety

- Use widget tests for RTL and shared component behavior.
- Use generated-file verification for architecture leaks.
- Use snapshots to track exact emitted Dart text.
- Use the roadmap and compliance docs as the source of policy.
