# Decision: Default Artifact Selection And Fail-Fast Registry

Date: 2026-06-24

## Decision

The generation pipeline defaults to the two supported FAHS artifacts:

- `ui`
- `router`

Other artifact families remain opt-in and unavailable until they have real specs and generators.

If a user enables an artifact that has no registered generator, the pipeline fails immediately.

## Reason

The repo currently has stable UI and router generation. It does not yet have real model, repository, use case, or BLoC spec sources. Treating those as optional but missing would create false confidence and partial output.

Failing fast preserves the generator contract and prevents quiet regressions.

## Consequences

- `npm run generate:pipeline` produces the current FAHS output by default.
- CLI or config can narrow the enabled artifacts.
- Adding a new artifact family requires a generator implementation and spec support first.
- Missing artifact registration becomes a hard error instead of a warning.

## Guardrails

- keep `ui` and `router` as the default enabled artifacts
- keep generated screens UI-only
- do not add plugin discovery yet
- add new artifact families only when the supporting specs exist
