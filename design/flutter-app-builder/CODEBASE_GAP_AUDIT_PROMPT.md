# Prompt: Flutter Codebase → Generator Gap Audit

> Reusable prompt. Point it at any existing Flutter codebase to reverse-engineer what our generator/IR must handle and find gaps in the design. Reference design: `DESIGN.md` (same folder).

---

## Copy-paste prompt

You are a Flutter architect + compiler/codegen engineer auditing an EXISTING Flutter codebase against a code-generation design. Your goal is to discover what the generator must be able to express and produce, and to find gaps where our generator/IR would fail.

First read the generator design: `/Users/username/Documents/cto/flutter_generator/design/flutter-app-builder/DESIGN.md` (the IR `ApplicationModel`, the four generation classes — structural/pattern/semantic/novel, ownership regions generated/scaffold/user, the correctness model, and the v3.2 production lessons).

Then audit this codebase: `<REPO_ROOT>` (recursively, `lib/` primarily; ignore `build/`, generated dirs, and test scaffolding you're not asked about).

Produce a structured report with these sections:

### 1. Structural inventory (what the IR must represent)
Walk `lib/` and extract the *shape* the code implies. For each, list concrete examples with file:line:
- **Entities / value objects** — fields, types, nullability, identity, relations, invariants.
- **Repositories / datasources / DTOs / mappers** — contracts, transport (REST/GraphQL/SQL), JSON envelope shape + nesting, serialization idioms (json_serializable/freezed/manual), error mapping.
- **Use cases / business logic** — which are mechanical (direct repo call) vs. genuine business rules (conditions, state, temporal, aggregate).
- **State** — state-management library (Riverpod/Bloc/Provider), state machines, async lifecycle (cancellation, single-flight, dispose).
- **Screens / components** — layouts, forms, navigation (routes/guards/deep links), DI wiring, localization, theme/tokens.

### 2. Determinism classification
For every artifact category found: mark it **structural / pattern / semantic / novel**. Where you mark "structural" or "pattern", state the exact IR fragment + generator that should produce it. Where you find an artifact our generator CANNOT currently express, flag it as a **GAP**.

### 3. Regeneration / ownership hazards
- Find code that a naive regenerator would **clobber**: hand-edited widgets, custom business logic, bespoke UI, extension points.
- Find where the codebase already mixes "generated-shaped" code with hand-written code — where would our `generated / scaffold / user` regions land?
- Identify any place the code relies on **hidden conventions, magic defaults, or template-specific metadata** that would not live in the IR (the "did we add semantic info not in the IR?" test).

### 4. Production hardening gaps (v3.2 lens)
Check the codebase for each and report what the generator must emit to prevent it:
- **A11y** — `Semantics(button:true)` placement, tooltip-only labels, unlabeled icon buttons, missing `selected`/`expanded` states, decorative-vs-informative images.
- **Layout** — `RenderFlex overflow`, missing `Flexible`/`isExpanded`/`scrollable`, viewport-squeeze failures.
- **Security** — secret literals, `dart.library.*` conditional imports, insecure token storage, swallowed type/deserialization errors.
- **Error model** — does the code map errors to distinct `Failure` types or swallow into generic messages?
- **Observability** — release-mode logging vs debug-only telemetry.

### 5. Ranked gap report (the deliverable)
A single table, ordered by severity, of things our generator/IR design is MISSING or WRONG for this codebase:

| # | Gap | Category (IR shape / generator / ownership / validation / hardening) | Evidence (file:line) | Severity (blocker/high/med/low) | Proposed design change |

### 6. "What the IR must add" list
A concrete list of IR schema changes or new generators implied by this codebase (e.g. "envelope nesting depth field", "secure-storage capability", "overflow-safe layout patterns"). Name them exactly as `DESIGN.md` sections would.

Be concrete and evidence-based — cite `file:line` for every claim. Do NOT propose fixes to the Flutter app itself; your output is a generator-gap report, not a code review. Do not edit any files.

---

## How to use

1. Replace `<REPO_ROOT>` with the absolute path of any Flutter project.
2. Point the reviewer's design reference at `DESIGN.md` (this folder).
3. Run once per candidate codebase (the mall-directory project is the reference case). Feed the ranked gap report + "what the IR must add" list back into `DESIGN.md`.

## Notes

- The mall-directory sweep already surfaced: double-nested envelope → `SerializationFailure` + per-endpoint typed parsers; admin overflow sweep → §14.4.3 layout validator; `flutter_secure_storage_web` release stall + `dart.library.html` silently-false → §10 secure-storage capability + forbid conditional imports; a11y catalog → §14.4.1.1. These are the *expected* shape of findings — the point of this prompt is to keep finding more of them, systematically.
- Aim the audit at `lib/`, not build artifacts. Ignore vendored/generated code except to observe how it interleaves with hand-written code (that interleaving IS a finding for section 3).
