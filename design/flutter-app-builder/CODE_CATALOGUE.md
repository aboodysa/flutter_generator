# CODE_CATALOGUE — what I wrote this session/round, and why

The "what and why" index (AGENTS rule 12). Every artifact written by opencode/claude this
round is listed here: path, what it is, why it exists, status. Additive — never delete.

## Generator fixes (builder/src) — RCA-driven
| Path | What | Why | Status |
|---|---|---|---|
| `builder/src/generators/rule.ts` | Enum comparison fix: `conditionExpr` qualifies enum values as `Priority.high` (was bare `high`); imports only the enum types actually compared in conditions | tasks app surfaced a compile error (`Undefined name 'high'`) for any rule over an enum field; all-import produced `unused_import` warnings | committed `8e262a0` |
| `builder/src/generators/screen.ts` | Parent→children navigation capability: detail screens get `View <Child>s` rows linking to child lists via `<Parent>Id` convention; child list screens filter by `?<fk>=<parentId>` query param | tasks app's follow-ups were unreachable from the task detail screen; general capability for any parent/child sample | committed `c40011e` |
| `builder/src/generators/project.ts` | `generateMain` provides a `BlocProvider` for EVERY distinct screen state (was `screens[0]` only) | multi-entity app crashed with `ProviderNotFoundException` on the second route (RCA-003) | uncommitted → commit with tasks goldens |
| `builder/src/generators/state.ts` + `screen.ts` | **B1: wizard flow-status namespaced as `wizardStatus`** (state.ts: enum-type-based default-qualification in the ctor, `finish()` emits `wizardStatus:`; screen.ts references `state.wizardStatus`) | a wizard step bound to the entity's own `status` field collided with the wizard's internal flow-status field → duplicate_definition analyzer errors; work_auth's review step had a field-less workaround (now restored to bind `status`) | committed `0385e5d` (typecheck clean, validation PASSED, work_auth 22/22) |

## Sample apps (apps/) — per-app artifact convention
| Path | What | Why | Status |
|---|---|---|---|
| `apps/tasks/input/tasks.ir.json` | tasks sample IR: Task (title, dueDate, priority enum, status enum open/closed) + FollowUp (taskId, note, createdAt) + HighPriority rule | demonstrate add/update/delete/close/reopen task + follow-up flows; exercise enum-rule + parent/child capabilities | committed `8e262a0` |
| `apps/tasks/input/rules/HighPriority.oracle.json` | oracle for HighPriority rule (4 cases) | rules without an oracle fail the validator gate | committed `8e262a0` |
| `apps/tasks/output/` | generated app + goldens + rca + validation.txt + README | per-app artifact convention (input left, output right) | committed |
| `apps/tasks/output/rca/RCA-001-enum-rule.md` | RCA for the rule-generator enum bug | root-cause analysis per AGENTS rule ("fix the generator, never the app") | committed `8e262a0` |
| `apps/tasks/output/goldens/*.png` | iPhone-size (390×844) screenshots of task list, task detail, task form, follow-up list | visual evidence for owner (Telegram) | committed `466ee78` |

## Docs (design/flutter-app-builder/)
| Path | What | Why | Status |
|---|---|---|---|
| `CAPABILITIES.md` | General app-type-agnostic capability catalog (L1–L5, MF1–MF6, C1–C2) with 4 sample apps as evidence | plan must be capability-driven, not Ledgerly-driven; each capability validated by ≥2 different app types | committed `739f933` |
| `LEDGERLY_MVP.md` | Ledgerly-MVP milestone: slice map (MVP item → generator slice), sequence, acceptance proof | Ledgerly is ONE sample of the general capability plan | committed `739f933` |
| `CODE_CATALOGUE.md` | this file | the what-and-why index the owner asked for | new |
| `research/PAYMENTS_OPTS.md` | Payments options report: SA/GCC provider landscape (Stripe, moyasar, Tap, HyperPay, PayTabs, Checkout.com, Paymob, wallets/BNPL), a `PaymentGateway` port + `MockPaymentGateway` + DTO + idempotency generator design, adapter-first recommendation (moyasar/Tap/Stripe), PCI posture, and now-vs-backend roadmap | input to a future `payments.v1` generator capability (deterministic, offline-first, SA-first); research-only spike per `~/temp/opencode/flutter-app-builder/RESEARCH_PAYMENTS.md` | new, uncommitted |
| `research/AUTH_OPTS.md` | Auth options report (295 lines): 2026 provider landscape (Supabase, Firebase Auth, Clerk, Keycloak, DIY JWT/OIDC) + biometric/passkeys; maps real auth onto the existing MF2 demo-auth (`builder/src/generators/auth.ts` Session/personas + route `guardPath` + repo `_inScope`/`_stampTenant`); proposes an `AuthProvider` port + `MockAuthProvider` (offline truth, byte-identical output), claims→Session mapper, `secureSession`/`biometric` emission, `[auth]` validator gate, Supabase-first adapter order, and now-vs-P9 roadmap | input to a future `auth.v2` generator capability (deterministic, offline-first, keeps tenant-scoped repos unchanged); research-only spike, web search disabled this run (facts flagged for go-live verify), no code changes | new, uncommitted |

## Temp/QA harnesses
| Path | What | Why | Status |
|---|---|---|---|
| `apps/tasks/output/app/test/temp_all_screens_golden_test.dart` | temporary golden harness rendering all screens (detail/form/follow-up list) through the real router | the generated golden test only renders list screens; this captures every screen as visual evidence; **keep as a reference for a future "golden all screens" generator capability** | present in working tree, NOT committed (regenerated out) — recreated on demand |
| `apps/tasks/output/rca/RCA-003-multi-cubit-main.md` | RCA for the multi-cubit main.dart crash | root-cause analysis of the real app bug found by the harness | committed `275da9d` |
| `apps/tasks/output/app/web/` | web platform for the tasks app (`flutter create . --platforms web`) + release build at `--base-href=/tasks/` | prerequisite for Tailscale expose (AGENTS rule 13) | uncommitted → commit |
| `apps/tasks/output/qa/tailscale_static_server.js` | node SPA-fallback static server serving `build/web` on 127.0.0.1:8081 | serves the tasks app through Tailscale Serve at `/tasks` without touching the mall app's `/` + `/api` mounts | running (nohup); copy under `apps/tasks/output/qa/` |
