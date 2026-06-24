# Generator Architecture Rules

Date: 2026-06-24

## Core Rules

1. Generated Flutter files must remain UI-only.
2. Navigation logic must live in shared app code or feature code, not in `lib/generated/screens`.
3. Specs are the source of truth. The generator must not infer screen-specific behavior from filenames.
4. Shared widgets must use direction-aware layout APIs when they need to work in both LTR and RTL.
5. Unsupported component types must fail loudly in strict generation mode.
6. New artifact families must have specs, generation code, and verification before they are treated as supported.

## SOLID Expectations

- **SRP**: each generator handles one artifact family.
- **OCP**: new generators are added by registration, not by editing the pipeline logic.
- **LSP**: every generator must satisfy the same contract.
- **ISP**: generator interfaces stay small and focused.
- **DIP**: orchestration depends on abstractions, not file-specific implementations.

## Compliance Checks

- `lib/generated/screens` must not contain direct navigation APIs.
- UI specs must not contain Flutter widget names or direct navigation code.
- Generated screens must pass the static verifier.
- Shared RTL components must have widget tests.
- New generators must be accompanied by tests before they are enabled by default.

## What To Do When A Rule Fails

1. Fix the shared widget or generator contract first.
2. Regenerate the screens.
3. Re-run verification and widget tests.
4. Only then update snapshots or golden baselines.
