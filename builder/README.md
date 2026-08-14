# Flutter App Builder — deterministic compiler (generic)

A **generic** Flutter app generator: `requirements → IR → idiomatic Flutter`, 0% LLM in the deterministic core.

## Flow (WHAT not HOW)

```
requirements.json  →  *.ir.json (semantic spec)  →  generators  →  feature-first Flutter app + tests
```

The IR is the *what* (concepts + behaviors); the generator picks the *how* (idiomatic Flutter). Benchmark proves **semantic parity**, not structural identity.

## Generators (24, registry-driven, feature-first output)

| Layer | Generators |
|---|---|
| Domain | entity, value_object, enum, query, wrapper, repository contract, use_case, state_machine, business_rule, validator |
| Data | model (DTO + acceptedKeys + mapping), datasource (dio), repository_impl |
| Presentation | state (enum-status cubit), screen (list/detail), form |
| Infrastructure | di (get_it), route (go_router), components (design system), localization, theme, config, secrets, observability |
| Testing | unit, widget, flow, golden |

Output layout: `lib/features/<feature>/{domain,data,presentation}/` + `lib/core/` + root barrel `lib/generated.dart`.

## Architecture

- **Registry** (`src/index.ts`): `artifact → {schema, generator, layer, file}`; OCP — add = one entry.
- **SymbolTable** (`src/symbols.ts`): typeName → package path; all cross-refs resolved through it.
- **Purity**: generators are `(IR, ctx?) → string`; only `index.ts` does I/O.
- **Scoring** (`src/scoring.ts`): deterministic pattern selection (§5.2).
- **Write-ACL** (`src/acl.ts`): human-only fields require `actor: human:attested` (§9.3).
- **Incremental regen** (`src/regen.ts`): dependency graph → affected-set (§13).
- **Reverse extraction** (`src/extract.ts`): Dart → IR entity (§11.2).

## Commands

```bash
npm run typecheck:builder                    # strict tsc
npm run build:app                            # generate expense sample → output/generated_app
npx ts-node --transpile-only builder/src/index.ts <ir> <out>
npm run validate:gen                         # determinism + headers + secrets + idioms + arch-linter
npm run pipeline                             # Execution Contract: generate→analyze→test→build-web→validators
npm run server                               # HTTP API (POST /generate, /requirements, /generate/full)
npx ts-node --transpile-only builder/src/benchmark.ts              # semantic parity
npx ts-node --transpile-only builder/src/benchmark.ts --structural <real> <gen>  # reference fixture
npx ts-node --transpile-only builder/src/regen.ts <ir> entity:X     # affected-set
npx ts-node --transpile-only builder/src/extract.ts <dart-file> Name  # reverse extraction
```

Generated app: `flutter analyze` + `flutter test` in the output dir (goldens: `--update-goldens` first).

## Standards & design

- `design/flutter-app-builder/CODING_STANDARDS.md` — 16 lint rules + arch invariants.
- `design/flutter-app-builder/DESIGN.md` (v3.5) — full design, incl. §8.1 designer attach point.

## Not yet implemented (LLM-dependent)

Phase 3 agents (Requirement/Domain/BusinessRule agents), Phase 4 3-way merge + full a11y validation. The deterministic cores (rule engine, write-ACL, incremental regen, reverse extraction) are built; the LLM reasoning layer is the next dependency.
