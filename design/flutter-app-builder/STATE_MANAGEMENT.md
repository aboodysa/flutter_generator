# State management — provider selection (enterprise best practice)

> Source: Flutter docs (`state-mgmt/options`, `app-architecture/recommendations`) + ecosystem
> consensus. Deterministic selection — never LLM — per DESIGN §5.2 (pattern) + §10 (generation
> strategies / plugin = strategy + template family + conformance).

## Providers (closed set)

| id | package | template family | conformance |
|---|---|---|---|
| `none` | — | no state layer, vanilla `setState`-free shell | app compiles, 0 state files |
| `bloc` | `flutter_bloc` | `state_enum_status.v1` (Cubit) + `state_sealed_events.v1` (sealed, future) | app compiles, tests green |
| `riverpod` | `flutter_riverpod` | `state_notifier.v1` (Notifier/AsyncNotifier) | app compiles, tests green |

## Selection (deterministic)

1. **Explicit override wins:** `attributes.stateManagement = "none" | "bloc" | "riverpod"`.
2. **Else §5.2 `scoreApp`:** complexity < `NONE_FLOOR` → `none`; otherwise → `bloc` (enterprise-safe default).
3. Rationale recorded in `plan.json` `scoring.stateManagement` + `reason` (auditable, like every other selection).

`riverpod` is never auto-selected today — it is the second coupled-pair cell (§10.2), chosen only
via the explicit override, until a second state-mgmt *strategy* is proven end-to-end.

## Why bloc is the default (enterprise)
- Unidirectional, event/state → predictable, deterministic, trivially testable (matches the rule
  engine + oracle model this builder already uses).
- First-class for the business-rule + state-machine surface (§19).
- Riverpod is the credible #2; kept as the coupled-pair proof, not the default.

## Implementation (OCP)
- `provider.ts` — `PROVIDERS: Record<ProviderId, ProviderDef>`; single source of truth for
  package deps, template selection, and conformance. Generators (`state`, `screen`, `di`,
  `main`, `pubspec`) consult the *selected* provider; they do not hardcode `bloc`.
- `types.ts` — `AppAttributes.stateManagement?` (explicit override).
- `scoring.ts` — `scoreApp` returns `"none" | "bloc" | "riverpod"` (honors override).
- `validate.ts` — provider-fidelity gate: emitted `template=` marker matches the selected provider.
