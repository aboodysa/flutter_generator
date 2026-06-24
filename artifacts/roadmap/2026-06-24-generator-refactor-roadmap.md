# Generator Refactor Roadmap

Date: 2026-06-24

## Vision

Turn the current codegen scripts into a small, extensible generation pipeline that can grow from FAHS UI generation into other artifact families without becoming another monolith.

## Near-Term

- Keep current FAHS UI and router generation stable.
- Preserve the current spec-driven HTML import path.
- Enforce architecture guards so generated files stay UI-only.
- Document the current SOLID and compliance rules.

## Mid-Term

- Extract the current generator into separate modules.
- Add a pipeline layer that selects generators by config.
- Keep support limited to already-backed artifacts first.
- Add strict failure when a requested artifact is missing.

## Long-Term

- Support additional artifact families such as models, repositories, use cases, BLoC, DI, and tests.
- Add those generators only when corresponding specs and validation rules exist.
- Keep each generator independently testable.

## Non-Goals For Now

- Do not add broad plugin discovery.
- Do not add placeholder generators for unsupported artifacts.
- Do not mix business logic into generated Flutter screens.
- Do not weaken guards to make the pipeline look more complete than it is.

## Success Criteria

- The current FAHS screens still regenerate correctly.
- RTL layout behavior remains stable across regeneration.
- Generated screens remain free of navigation and business logic.
- New artifacts can be added without rewriting the orchestration layer.
