
> orchestrator · deepseek-v4-flash-free

→ Read lib
→ Read /Users/username/Documents/cto/flutter_generator/design/flutter-app-builder/DESIGN.md
Design doc read. Now surveying the top-level structure to define precise audit lanes.
→ Read lib/features
→ Read lib/core
→ Read lib/shared
→ Read lib/features/expense
→ Read lib/core/routes
→ Read lib/core/error
→ Read lib/core/usecase
✱ Glob "lib/core/dio_client/**/*.dart" 4 matches
✱ Glob "lib/features/expense/**/*.dart" 75 matches
✱ Glob "lib/core/di/**/*.dart" 20 matches
• Audit data layer for IR Explorer Agent
• Audit domain/use-case layer Explorer Agent
• Audit state-management patterns Explorer Agent
• Audit presentation/nav/DI layer Explorer Agent
• Hardening-gap scan Explorer Agent
Codebase layout is clear: Clean Architecture per feature (`data/domain/presentation`), a `core/` layer (di, dio_client, error, routes, theme, lang, bloc, dataBase), `shared/widgets`, go_router + get_it + bloc/cubit. Dispatching five parallel read-only audit lanes.

> orchestrator · deepseek-v4-flash-free

→ Read lib/core/error/failures.dart
→ Read lib/core/error/failure_mapper.dart
→ Read lib/core/error/exceptions.dart
→ Read lib/core/error/server_exception.dart
→ Read lib/core/error/database_failures.dart
The five lanes were interrupted before returning results, so per your instruction I'll compile the report directly from targeted evidence gathering — no re-dispatch. Reading the anchor files now.
→ Read lib/core/usecase/usecase.dart
→ Read lib/core/dio_client/dio_client.dart
→ Read lib/core/dio_client/endpoints.dart
→ Read lib/core/dio_client/api_keys.dart
→ Read lib/core/routes/app_router.dart
→ Read lib/core/routes/app_routes.dart
→ Read lib/core/routes/auth_navigation_handler.dart
→ Read lib/features/expense/data/models/expense_models.dart
→ Read lib/features/expense/data/models/detailed_expense_response.dart
→ Read lib/features/expense/domain/entities/expense_entities.dart
→ Read lib/features/expense/domain/repositories/expense_repository.dart
→ Read lib/features/expense/data/datasources/expense_remote_data_source.dart
→ Read lib/features/expense/data/repositories/expense_repository_impl.dart
→ Read lib/features/expense/data/datasources/expense_local_data_source.dart
→ Read lib/features/expense/domain/usecases/get_transactions_use_case.dart
→ Read lib/features/expense/domain/usecases/add_expense_use_case.dart
→ Read lib/features/expense/presentation/logic/all_expenses/all_expenses_cubit.dart
→ Read lib/features/expense/presentation/logic/all_expenses/all_expenses_state.dart
✱ Grep "Semantics|ExcludeSemantics|MergeSemantics|SemanticsService" in lib · 0 matches
✱ Grep "catchError|catch \(_\)|catch \(e\)|catch \(err\)|on Exception catch|on Error catch" in lib · 100 matches
✱ Grep "debugPrint|kDebugMode|dart.library|crashlytics|Sentry|sentry" in lib · 100 matches
✱ Grep "SharedPreferences|flutter_secure_storage|secureStorage|getStorage" in lib · 29 matches
Now the hardening greps and remaining core reads — all independent, batched.
→ Read lib/core/theme
→ Read lib/core/utils/logger.dart
→ Read lib/core/bloc/app_bloc_observer.dart
→ Read lib/core/di/service_locator.dart
→ Read lib/core/di/modules/expense_di.dart
→ Read lib/core/lang
→ Read lib/core/bootstrapper/app_bootstrapper.dart
→ Read lib/shared/widgets
→ Read lib/rasheed_app.dart
→ Read lib/core/theme/theme_cubit.dart
→ Read lib/features/expense/presentation/screens/all_expenses_screen.dart [limit=150]
→ Read lib/features/expense/presentation/logic/expense_form/expense_form_state.dart
→ Read lib/features/expense/domain/entities/transaction_query.dart
✱ Grep "Tooltip\(" in lib · 3 matches
✱ Grep "extends HydratedCubit|HydratedBloc|with HydratedMixin" in lib · 8 matches
→ Read lib/features/expense/domain/mappers/transaction_filter_mapper.dart
✱ Glob "lib/features/sync/**/*.dart" 19 matches
✱ Glob "lib/core/dataBase/**/*.dart" 25 matches
→ Read lib/features/auth/presentation/logic/session/session_state.dart
→ Read lib/core/dataBase/sqlite_service.dart
→ Read lib/core/dataBase/schema/tables/outbox_table.dart
→ Read lib/features/sync/domain/usecases/run_sync_usecase.dart
→ Read lib/features/expense/presentation/widgets/all_expenses/filter_chip.dart
→ Read lib/core/utils/app_colors.dart [limit=60]
✱ Grep "IconButton\(" in lib · 7 matches
✱ Grep "TextFormField\(|Form\(" in lib · 42 matches
✱ Grep "Row\(|Column\(" in lib · 100 matches
→ Read lib/features/sync/data/services/cycle_sync_reconciler.dart
→ Read lib/features/expense/presentation/widgets/new_expense/expense_form.dart [limit=120]
✱ Grep "sealed class" in lib · 1 match
✱ Grep "'[A-Z][a-z]+ [a-z]+'\.tr\(|"[A-Z][a-z]+ [a-z]+"\.tr\(" in lib · 0 matches
→ Read lib/core/dataBase/migrations.dart [limit=60]
Final evidence round — forms, migrations, and sealed-state check.
→ Read lib/features/home/domain/entities/transaction_entity.dart [limit=130]
→ Read lib/features/expense/presentation/widgets/expense_details/receipt/detail_row.dart
→ Read pubspec.yaml [limit=100]
✱ Grep "\.tr\(" in lib · 100 matches
All evidence gathered. Compiling the final report.

---

# Generator-Gap Audit: `rasheedapp` vs. Flutter App Builder DESIGN.md v3.2

**Codebase:** `/Users/username/Documents/cto/Rasheed/rasheedapp/lib` — 23 features, Clean Architecture per feature (`data/domain/presentation`), bloc 8.1.4 / flutter_bloc 8.1.6 / hydrated_bloc 9.1.5 / get_it 8.0.1 / go_router 17.1.0 / dio 5.8 / sqflite 2.4.2 / easy_localization 3.0.7 / sentry_flutter 9.14 / firebase_crashlytics 4.0 / flutter_secure_storage 9.2.4 / dartz 0.10.1 (`pubspec.yaml:12-100`). **No** json_serializable, freezed, build_runner, drift, hive, injectable, or formz — serialization is 100% manual, DB is raw SQL, DI is manual get_it, validation is hand-rolled.

---

## 1. Structural inventory (what the IR must represent)

### 1.1 Entities / value objects

- **Large flat entities with mixed nullability and no invariants.** `TransactionEntity` (`lib/features/home/domain/entities/transaction_entity.dart:11-126`) has 40+ fields: identity is `String id` (server `transactionCode`), relations are `List<TransactionAttachmentEntity>`, `List<TransactionItemEntity>`, `List<ExpensePaymentEntity>` (`:57-59`), plus a `static TransactionEntity.empty()` sentinel factory (`:64-77`). No `assert`/constructor validation anywhere — invariants are absent, not declarable.
- **Model-extends-entity pattern.** `ExpenseCategoryModel extends ExpenseCategory` (`lib/features/expense/data/models/expense_models.dart:5`) — the DTO is a subclass of the domain entity, not a separate type with a mapper. The IR's `models`/`mappers` split assumes distinct types.
- **Query VOs with transport coupling.** `TransactionQuery` (`lib/features/expense/domain/entities/transaction_query.dart:1-92`) is a domain VO that carries `toQueryParams()` (`:62-91`) — the domain object knows the wire parameter names (`pocketCode`, `allTransactions`, `categoryCode`). IR `ValueObject` has no "query/params" concept.
- **Enums as domain types.** `PaymentMethod { cash, creditCard, other }` (`expense_entities.dart:4`), `ExpenseInputSource` (`expense_form_state.dart:7`), `UserType` (via `core/utils/enums.dart`), `SyncOpType`, `OutboxStatus` (`lib/features/sync/domain/entities/`). IR has no enum/status primitive beyond rule-language status checks.
- **Localization-aware computed properties on entities.** `ExpenseCategory.displayName(languageCode)` (`expense_entities.dart:29-41`) branches on `scope == 'USER'` and language — a business rule embedded in an entity getter.
- **Static in-code catalogs acting as mini-databases.** `core/utils/lists.dart` holds a hardcoded `categories` list (id/labelKey/iconAsset) that mappers join against (`expense_remote_data_source.dart:106-112`). The IR has no "static catalog constant" concept.

### 1.2 Repositories / datasources / DTOs / mappers

- **Repository contracts mix streams and futures.** `ExpenseRepository` (`lib/features/expense/domain/repositories/expense_repository.dart:12-43`): `watchTransactions` returns `Stream<TransactionsPage>` (cache-then-fresh), `getSimpleExpense`/`getDetailedExpense` return `Future<TransactionEntity>`. `TransactionsPage { transactions, fromCache }` (`:5-10`) is a cache-flag wrapper type the IR has no slot for.
- **Cache-through repository implementation.** `ExpenseRepositoryImpl.watchTransactions` (`lib/features/expense/data/repositories/expense_repository_impl.dart:20-47`) yields cached rows, fetches remote, re-caches, re-yields; swallows remote failure into `AppLogger.e` (`:40-46`) — the "HTTP 200 + swallowed error" class.
- **Blind multi-shape envelope unwrap.** `ExpenseRemoteDataSource._extractList` (`lib/features/expense/data/datasources/expense_remote_data_source.dart:41-52`) tries `List` → `data` → `data.transactions/items/data` and **silently returns `const []`** on mismatch. This is precisely the shared "unwrap one layer" utility DESIGN.md §4 v3.2 forbids.
- **Tolerant multi-alias parsers.** `DetailedExpenseResponse.fromJson` (`lib/features/expense/data/models/detailed_expense_response.dart:73-178`) accepts 4-6 key aliases per field (`json['totalAmount'] ?? json['total_amount'] ?? json['amount'] ?? json['total_incl_vat'] ?? 0`, `:74-81`; `transactionCode ?? transaction_code ?? id`, `:110-113`). A strict per-endpoint typed parser (the design's v3.2 rule) would **break** these endpoints.
- **Novel normalization mappers.** `_toTransactionModel` (`expense_remote_data_source.dart:54-175`) does category-catalog join, capture-method normalization switch (`:177-184`), icon lookup (`:186-196`), item parsing with 3 key aliases (`:198-230`). `DetailedExpenseResponse.toEntity` (`detailed_expense_response.dart:180-258`) is localization-aware (Arabic/English store+category names from nested maps, `:185-195`). Both exceed the design's "direct/configured" mapper classes.
- **Manual serialization everywhere.** `ExpenseCategoryModel.fromJson/toJson` (`expense_models.dart:18-44`) — hand-written, no codegen. The design's `ModelGenerator` assumes a serialization plugin (json_serializable/freezed/manual); "manual" is the only one that fits, and the tolerant-alias idiom is not parameterizable.
- **Raw-SQL local datasource.** `ExpenseLocalDataSource` (`expense_local_data_source.dart:11-119`) builds `WHERE` clauses with `StringBuffer` (`:14-52`), queries table `'Expesne'` (typo'd table name, `:55`), and does outbox-aware caching (`:68-119`). DB schema is raw `CREATE TABLE` strings with CHECK constraints (`lib/core/dataBase/schema/tables/outbox_table.dart:6-22`); `schemaVersion = 1` with an **empty `onUpgrade`** (`lib/core/dataBase/migrations.dart:7,17-21`).
- **Offline-first outbox.** `outbox` table with `status IN ('pending','in_flight','failed')`, `attempts`, `next_attempt_at`, `last_error` (`outbox_table.dart:14-21`) — a full offline-queue persistence model the IR's `persistence.syncStrategy: offlineQueue` only sketches.
- **Error mapping.** `ServerException.fromDioException` (`lib/core/error/server_exception.dart:9-24`) maps DioExceptionType → **localization keys as messages** (`"requestCancelled"`, `"noInternetConnection"`, `:14-18`); `_handleError` reads `response.data['message']` (`:32-37`); `_handleUnknownError` string-matches exception text (`:46-62`). `DatabaseExceptionMapper` (`lib/core/error/database_failures.dart:17-36`) maps sqflite errors to typed failures.

### 1.3 Use cases / business logic

- **Mechanical passthroughs dominate.** `GetTransactionsUseCase` (`lib/features/expense/domain/usecases/get_transactions_use_case.dart:4-20`), `RunSyncUseCase` (`lib/features/sync/domain/usecases/run_sync_usecase.dart:7-15`) — direct repo delegation. `UseCase<T, Params>` base (`lib/core/usecase/usecase.dart:3-5`) is a plain `Future<T> call(Params)`.
- **Genuine orchestration.** `AddExpenseUseCase` (`add_expense_use_case.dart:17-47`): attachment path remapping + `FileUtils.isImage` file-type inference + `copyWith` — a multi-step workflow with a side-effectful sub-use-case.
- **Genuine business rules (all in the data/presentation layer, not use cases):**
  - Client-side residual filtering: `TransactionFilterMapper.applyResidualFilters` (`lib/features/expense/domain/mappers/transaction_filter_mapper.dart:60-91`) — string-contains search + min/max comparisons; `_normalizeEndOfDay` (`:88-91`) — temporal.
  - Cross-entity sync integrity: `CycleSyncReconciler` (`lib/features/sync/data/services/cycle_sync_reconciler.dart:20-126`) — ensures cycles are queued before expenses referencing them (`_validateExpenseCycleIntegrity`, `:110-126`). **Cross-feature rule** (expense ↔ cycle) — §19 out-of-scope.
  - Online-only shared pockets: `SharedPocketOfflineException` (`server_exception.dart:75-87`) — a domain rule encoded as an exception with a hardcoded English message (`:82`).
  - Auth state machine: `SessionCubit` (`lib/features/auth/presentation/logic/session/session_cubit.dart`) with states `SessionInitial/Loading/Authenticated/Unauthenticated/Expired` (`session_state.dart:36-77`) — a real state machine with guards (`isRegistered`, `isGuest`).
  - Duplicate-transaction rule: `DuplicateTransactionFailure.invoiceNumber` (`failures.dart:52-57`).
  - OCR validation: `OcrValidationFailure` (`failures.dart:47-50`).
  - Router flow-state: `_isNestedOtpFlow` (`lib/core/routes/app_router.dart:22-34`).
- **Rule-language fit:** the residual filters, end-of-day normalization, capture-method switch, and displayName branches are expressible as §19 expressions/decision tables. The reconciler's cross-entity integrity check and the auth state machine's side effects (navigation, token refresh) are **not** — they hit §19 out-of-scope (cross-feature, I/O-in-rule).

### 1.4 State

- **Cubit-only, single-class-with-enum states.** `AllExpensesState` (`lib/features/expense/presentation/logic/all_expenses/all_expenses_state.dart:7-64`): one class, `enum AllExpensesStatus { initial, loading, refreshing, success, failure }` (`:5`), Equatable + `copyWith`. `ExpenseFormState` (`expense_form_state.dart:9-174`) is a 20-field mutable-form state with `isContentEqual` deep-equality (`:159-173`).
- **Abstract-class states, not sealed.** `SessionState` (`session_state.dart:6-34`) is `abstract` with subclasses; **only one `sealed class` exists in the entire codebase** (`lib/no_internet/logic/connectivity_state.dart:4`). The design's sealed-events strategy and exhaustiveness lints do not match the dominant idiom.
- **HydratedCubit for 6 cubits** (session, theme, language, home, user, biometrics — `theme_cubit.dart:4`, `language_cubit.dart:4`, `home_cubit.dart:27`, `session_cubit.dart:21`, `user_cubit.dart:23`, `biometrics_cubit.dart:13`). `SessionState.fromJson/toJson` is hand-rolled (`session_state.dart:20-33,60`).
- **Async lifecycle is hand-disciplined, not structural.** `AllExpensesCubit` (`all_expenses_cubit.dart:11-225`): debounce timer (`:12,96-105`), subscription cancellation on refetch (`:118`), `isClosed` guards (`:48,132,142,203`), `close()` cancels all subscriptions (`:217-224`). But **no `CancelToken` is ever passed** to dio calls (dio_client supports it, `dio_client.dart:227,249,283,310,333,352`; datasources never pass one), and the screen manually calls `_cubit.close()` in `dispose` (`all_expenses_screen.dart:69`) while using `BlocProvider.value` (`:83`) — a double-dispose hazard the design's conformance suite would flag.
- **Cross-cubit coordination via BlocListener.** `AllExpensesScreen` wires `AllExpensesCubit` ↔ `HomeCubit` refresh loops (`all_expenses_screen.dart:85-116`); `rasheed_app.dart:64-101` has global `MultiBlocListener` for session-expiry → toast + `AppRouter.router.go(login)` (`:72-86`) — **navigation driven from state**, which the design's StateModel has no construct for.

### 1.5 Screens / components / navigation / DI / localization / theme

- **Screens are StatefulWidget + BlocProvider.value + manual DI lookup.** `AllExpensesScreen` (`all_expenses_screen.dart:24-150`): `late final AllExpensesCubit _cubit = di.sl<AllExpensesCubit>()` (`:35`) — service-locator-in-widget. `ExpenseForm` (`expense_form.dart:39-120`): `TextEditingController` listeners push to cubit (`:57-72`), **no `Form`/`TextFormField` validators** — validation lives in state getters (`isAmountValid`, `expense_form_state.dart:55-57`); submit states via `isSubmitting` (`:27`).
- **Shared text field with error display.** `AuthTextFormField` (`lib/shared/widgets/text_fields/auth_custom_text_field.dart:38,108,195`) — the de-facto form component; `displayError.tr()` (`:195`).
- **Navigation: one monolithic redirect closure.** `AppRouter` (`app_router.dart:36-257`): a single `redirect:` closure (`:111-196`) encoding auth/guest/registered/deep-link logic; **static mutable globals** `deepLinkRedirectTarget`, `pendingPocketType`, `signupFlowInProgress` (`:39-41`); deep links via `/ref/:code` + query params (`:203-246`); `errorBuilder` renders `state.error.toString()` into UI (`:248-252`). Route groups per feature (`route_groups/*.dart`).
- **DI: manual get_it, per-feature modules.** `expense_di.dart:18-47`: `registerLazySingleton` for datasources/repos/usecases, `registerFactory` for cubits. `service_locator.dart:1-2` is a shim exporting `injection_container.dart`. `ScopedBlocProviders` (`lib/core/providers/scoped_providers.dart:30`) wraps routes in BlocProviders — a DI/routing hybrid.
- **Localization: key-based `.tr()` everywhere** (100+ matches), `easy_localization` with `en`/`ar` (`rasheed_app.dart:35-42`). **Convention: exception messages ARE localization keys** (`server_exception.dart:14-18`), and `FailureMapper.toMessage()` returns keys (`failure_mapper.dart:20,25,31`). Hardcoded English leaks exist (`server_exception.dart:82`).
- **Theme: no token system.** `lib/core/theme/` contains only `theme_cubit.dart` (a `HydratedCubit<ThemeMode>`). Colors are ~97 hardcoded `Color(0xFF…)` constants in `AppColors` (`lib/core/utils/app_colors.dart:3-60+`); `ThemeData` is built inline with `ColorScheme.fromSeed` (`rasheed_app.dart:145-154`). `flutter_screenutil` scaling (`rasheed_app.dart:117-119`) is a global layout system the IR's responsive model doesn't know.
- **Shared widget inventory** (`lib/shared/widgets/`): buttons/, text_fields/, loaders/, toast/, dialogs/, bottom_sheets/, switch/, pickers/ — a de-facto component library with **no semantic contracts, no tokens, no variants registry**.

---

## 2. Determinism classification

| Artifact category | Class | IR fragment + generator | GAPs |
|---|---|---|---|
| Entity (e.g. `TransactionEntity`) | structural | `entities[]` → EntityGenerator | 40+ fields w/ mixed nullability fine; but **no invariant/assert slot**; `empty()` sentinel factory not expressible; relations as `List<X>` fine |
| VO (e.g. `TransactionQuery`) | structural | `valueObjects[]` → ValueObjectGenerator | **Query VO with `toQueryParams()`** — IR has no query/params concept; wire-name coupling not expressible |
| Enum/status types | structural | `valueObjects[]` (enum) | IR has no first-class enum primitive (only rule-language status checks) |
| Model-extends-entity DTO (`ExpenseCategoryModel extends ExpenseCategory`) | structural | `models[]` → ModelGenerator | **Generator assumes model ≠ entity**; subclass pattern unrepresentable |
| Manual tolerant-alias serialization | **pattern** | `models[].serialization` | **GAP (blocker):** per-endpoint typed parser (v3.2) contradicts the codebase's multi-alias lenient idiom; no IR field for "accepted key aliases" or "lenient vs strict" |
| Envelope unwrap (`_extractList`) | structural | `datasources[].envelope` | **GAP (blocker):** design declares ONE shape per endpoint; codebase has a shared multi-shape unwrap with silent `[]` fallback — needs `envelopeVariants[]` + fail-on-mismatch policy |
| Repository contract (stream + future, cache-flag wrapper) | structural | `repositories[]` → RepositoryContractGenerator | `Stream<TransactionsPage>` with `fromCache` flag — **no cache-through/stream return type in IR** |
| Repository impl (cache-through) | pattern | `repositories[].cacheStrategy` → CacheStrategyAgent | cache-then-fresh + outbox-aware caching is a real strategy; design's `cacheThrough` is a sketch |
| Mapper (direct/configured) | structural/pattern | `mappers[]` → MapperGenerator | `_toTransactionModel`/`toEntity` are **novel** (catalog join, localization-aware, normalization) — would fall to Novel lane for ~every endpoint |
| Use case shell (mechanical) | structural | `useCases[]` → UseCaseGenerator | fine |
| Use case orchestration (`AddExpenseUseCase`) | semantic | `useCases[].steps` → BusinessRuleAgent | multi-step with side-effectful sub-use-case — **no workflow/step model in IR** |
| Business rules (filters, end-of-day, capture-method) | semantic | `businessRules[]` → RuleCodeGenerator | expressible as §19 expressions/decision tables — OK |
| Cross-entity sync integrity (`CycleSyncReconciler`) | **novel** | — | **GAP:** §19 out-of-scope (cross-feature, DB I/O in rule); would wrongly land in Novel or extension queue |
| State (single-class + enum) | pattern | `stateMachines[]` / StateModel | **GAP:** dominant idiom is enum-status single class, not sealed states; design's sealed-events strategy + exhaustiveness lint mismatch |
| HydratedCubit persistence | pattern | `stateMachines[].persistence` | hydrated_bloc plugin exists in matrix? **Not listed** in §10 plugins (riverpod/bloc/provider/signals only) — needs hydrated_bloc strategy |
| Async lifecycle (debounce, cancel, isClosed) | pattern | StateModel lifecycle | **GAP:** no IR construct for debounce, subscription-cancel-on-refetch, manual `close()`; conformance suite would flag the manual-close pattern |
| Navigation (monolithic redirect + static globals) | structural | `navigation[]` → RouteGenerator | **GAP:** guards are one imperative closure with mutable static state — no declarative guard model; deep-link-with-query-param flows not expressible |
| DI (manual get_it modules) | structural | `di` → DIGenerator | fine (get_it plugin exists); but `di.sl()` in widgets is an idiom the arch-linter would need to forbid |
| Localization | structural | `localization[]` → LocalizationGenerator | **GAP:** "exception message = l10n key" convention not expressible; hardcoded strings in exceptions |
| Theme/tokens | structural | `theme[]` → ThemeGenerator | **GAP (blocker):** no token system exists; ~97 hardcoded colors + inline ThemeData — IR ThemeModel has no "extract from existing constants" path; arch-linter "no raw constants" would fail the whole app |
| Forms | pattern | `forms[]` → ScreenGenerator | **GAP:** validation lives in cubit state getters, not Form validators; no IR binding between field and error state; submit via `isSubmitting` flag |
| Observability | structural | `observability[]` → ObservabilityGenerator | **GAP (blocker):** AppLogger is debugPrint-only; no release sink for app-level failures |

---

## 3. Regeneration / ownership hazards

- **Bespoke UI everywhere a regenerator would clobber.** Receipt widgets (`expense_details/receipt/*` — 15 files), custom chips (`filter_chip.dart`), bottom sheets, dialogs — all hand-written, none IR-shaped. A naive regenerator overwriting `presentation/widgets` destroys them. These are **user** regions under §11.
- **Model-extends-entity files** (`expense_models.dart:5`) are a generated/scaffold hybrid: regenerating the model would rewrite the entity subclass boundary.
- **Hand-written data-shape knowledge not in any IR:** `_extractList` envelope variants (`expense_remote_data_source.dart:41-52`), key-alias chains (`detailed_expense_response.dart:73-178`), the `'Expesne'` table-name typo (`expense_local_data_source.dart:55`), static catalogs (`core/utils/lists.dart`). Reverse-extraction (§11.2) would need to lift these into IR or quarantine them as `ExternalCodeNode`s.
- **Static mutable router state** (`app_router.dart:39-41`) and the monolithic redirect closure (`:111-196`) — a regenerator emitting declarative routes would conflict with hand-maintained imperative guard logic.
- **Hidden conventions that would not live in the IR:**
  - Exception messages are l10n keys (`server_exception.dart:14-18`; `failure_mapper.dart:20-33`) — the UI must `.tr()` them; a generator emitting raw messages breaks the convention.
  - `flutter_screenutil` `.w/.h/.sp` scaling everywhere (`rasheed_app.dart:117-119`) — layout params in IR would be emitted without screenutil and render differently.
  - `AppColors`/`FontStyles` constants referenced by name in every widget (`app_colors.dart`) — the IR's token model has no mapping to these names.
  - `HydratedBloc.storage` key names (`'LanguageCubit'`, `rasheed_app.dart:49`) — magic strings.
  - `BlocProvider.value` + manual `_cubit.close()` (`all_expenses_screen.dart:69,83`) — a lifecycle convention a regenerator must replicate exactly or introduce double-dispose.
  - `ScopedBlocProviders` route-wrapping (`scoped_providers.dart:30`) — DI wiring split between get_it and widget-tree providers.

---

## 4. Production hardening gaps (v3.2 lens)

### A11y — **critical, near-total absence**
- **Zero `Semantics`/`ExcludeSemantics`/`MergeSemantics`/`SemanticsService` in the entire `lib/` tree** (grep: no matches). The design's §7 topology guarantee and §8 semanticContract have nothing to map onto.
- **Unlabeled interactive elements:** `IconButton(icon: Icon(Icons.refresh), onPressed: ...)` with no tooltip/label (`expense_debug_page.dart:52,57`); `IconButton` in `voice_close_button.dart:13`, `shared_pocket_scan_screen.dart:186`, `sqlite_viewer_screen.dart:343,606`. Only 7 `IconButton(` sites total; only 2 real `Tooltip(` sites (both in the debug-only `sqlite_viewer_screen.dart:604,662`).
- **Tappable chip with no selected state** — the exact §14.4.1.1 audit finding: `FilterChipWidget` is a custom `InkWell`+`Container` with `isSelected` only affecting color (`filter_chip.dart:20-44`). No `selected` semantics, no role.
- **GestureDetector without semantics:** `GestureDetector(onTap: () => FocusScope.of(context).unfocus(), ...)` wrapping the whole expense form (`expense_form.dart:88-89`); `InkWell`-based rows throughout.
- **Decorative vs informative images:** SVG icons rendered via `flutter_svg` with no labels (`_captureIcons` map, `expense_remote_data_source.dart:186-193`).

### Layout
- **Mixed discipline.** Positive: `DetailRow` uses `Flexible` + `TextOverflow.ellipsis` (`detail_row.dart:24-30`). Negative: `_buildInfoRow` in `business_summary_card.dart:184-192` puts two `BusinessInfoColumn`s in a `Row` with no `Flexible`/ellipsis — long values overflow; `Row`/`Column` appear in 100+ files with fixed-width `Text` siblings (e.g. `home_header.dart:70,151`, `spent_section.dart:86,132`). The design's viewport-squeeze validator would catch these; the generator's "text adjacent to fixed-width sibling → Flexible" rule is exactly what's missing.
- **Screenutil as a global scaling layer** (`rasheed_app.dart:117-119`) — the design's responsive model has no equivalent axis.

### Security
- **Secret literals committed:** Sentry DSNs as `static const` in source (`lib/core/dio_client/app_strings.dart:4-7`) — direct §20 violation; `SecurityValidator` would fail the build.
- **Token storage is correct** (flutter_secure_storage, `lib/features/auth/data/datasources/local_ds.dart:102-106,119-120`; Android `encryptedSharedPreferences`, `core_di.dart:59-60,85`). `SharedPreferences` used only for non-secret state (biometrics lock `biometrics_lock_service.dart:5`, online-mode flag `online_mode_local_datasource.dart:9`).
- **No `dart.library.*` conditional imports found** (grep: none) — the §14.3 forbidden idiom is absent; good.
- **Swallowed errors:** 100+ catch sites; empty/comment-only bodies at `currency_util.dart:130,144,179,190`, `timezone_helper.dart:20,29`, `sqlite_service.dart:35,41,44`, `date_helper.dart:18,28`, `network_info.dart:27`, `device_info_service.dart:36,115`, `categories_cubit.dart:66` (`catch (_) {}`), `rasheed_app.dart:52`.

### Error model
- **Taxonomy exists but diverges from §17:** `ServerFailure, CacheFailure, NetworkFailure, SocialSignInCanceledFailure, UnauthenticatedFailure, UnauthorizedFailure, FileFailure, OcrValidationFailure, DuplicateTransactionFailure` (`failures.dart:17-57`) + `DatabaseFailure/UniqueConstraintFailure/ForeignKeyConstraintFailure` (`database_failures.dart:4-15`). **Missing: `SerializationFailure`** (the design's load-bearing v3.2 type), `ValidationFailure`, `UnknownFailure`.
- **Generic collapse:** `FailureMapper.toMessage()` returns `'unexpectedError'` for everything not matched (`failure_mapper.dart:33`); `ServerException._handleError` falls back to `"unexpectedError"` (`server_exception.dart:42`); `_extractList` silently returns `[]` on shape mismatch (`expense_remote_data_source.dart:51`) — the exact "swallowed type error into generic message" class §14.3/§17 forbid.
- **`error.toString()` into UI:** `errorBuilder` renders `state.error.toString()` (`app_router.dart:250`); `AllExpensesCubit._onError` stores `e.toString()` as `errorMessage` (`all_expenses_cubit.dart:170-178`).

### Observability
- **AppLogger is debugPrint-only, including `.e()`** (`logger.dart:4-26`) — no release-mode sink for app-level failures. Violates §21 release-safe-by-default.
- Crashlytics captures only `FlutterError.onError` + `PlatformDispatcher.onError` (`app_bootstrapper.dart:37-42`) and `BlocObserver.onError` (`app_bloc_observer.dart:22-26`); Sentry init is flavor-gated (`main_development.dart:15-16` disables it). Repository-level failures (`expense_repository_impl.dart:40-46`) and cubit error paths (`all_expenses_cubit.dart:170-178`) never reach a release sink.
- 100+ `debugPrint`/`print` calls, many debug-gated (`app_bloc_observer.dart:9-11,17-19,35-37`; `analytics_service.dart:22-23,33-34`).

---

## 5. Ranked gap report (the deliverable)

| # | Gap | Category | Evidence | Severity | Proposed design change |
|---|---|---|---|---|---|
| 1 | **Per-endpoint typed parser contradicts the codebase's tolerant multi-alias parsing** — strict parsers would break live endpoints; lenient idiom is not parameterizable | IR shape / generator | `detailed_expense_response.dart:73-178`; `expense_remote_data_source.dart:54-175` | **blocker** | Add `ModelField.acceptedKeys: string[]` + `parseMode: strict\|lenient` to `models[]`; `ModelGenerator` emits alias-chain fallback; `SerializationFailure` on total mismatch |
| 2 | **Envelope model assumes one shape per endpoint; codebase has a shared multi-shape unwrap with silent `[]` fallback** | IR shape / validation | `expense_remote_data_source.dart:41-52` | **blocker** | `datasources[].envelopeVariants[]` (ordered); generator emits per-endpoint variant parser; validator forbids shared unwrap utilities and silent-empty fallback |
| 3 | **No token/design-system layer exists — ~97 hardcoded colors + inline ThemeData; IR ThemeModel has no extraction path** | IR shape / generator / ownership | `app_colors.dart:3-60`; `rasheed_app.dart:145-154`; `core/theme/` (only `theme_cubit.dart`) | **blocker** | Add `ThemeModel.tokens` with `source: existing-constants`; `ThemeGenerator` emits token classes from a declared palette; arch-linter "no raw Color literals" only after token extraction |
| 4 | **Observability: AppLogger is debugPrint-only; app-level Failure paths have no release sink** | hardening | `logger.dart:4-26`; `expense_repository_impl.dart:40-46`; `all_expenses_cubit.dart:170-178` | **high** | `ObservabilityModel` gains `releaseSink: sentry\|crashlytics\|none`; `ObservabilityGenerator` emits release-mode `captureException` on every Failure-producing path; validator requires non-debug-gated call per Failure path (§21) |
| 5 | **`SerializationFailure` missing from the Failure taxonomy; generic `'unexpectedError'` collapse** | IR shape / hardening | `failures.dart:3-57`; `failure_mapper.dart:33`; `server_exception.dart:42` | **high** | Add `SerializationFailure{endpoint, expectedShape, actualShape, raw}` to the Failure taxonomy; `FailureMapper` must never collapse a typed failure to a generic key |
| 6 | **State idiom is single-class + enum status, not sealed states; only 1 sealed class in the codebase** | generator / validation | `all_expenses_state.dart:5-64`; `session_state.dart:6-34`; `connectivity_state.dart:4` | **high** | Add a third generation strategy "enum-status state" to §10.1; sealed-events exhaustiveness lint must be strategy-scoped, not global |
| 7 | **Async lifecycle: no CancelToken usage, manual `_cubit.close()` + `BlocProvider.value` double-dispose hazard** | generator / validation | `dio_client.dart:227-364` vs `expense_remote_data_source.dart:22-39`; `all_expenses_screen.dart:69,83` | **high** | StateModel lifecycle gains `cancellation: requestToken\|subscription\|none` and `ownership: provider\|manual`; conformance suite asserts no manual close under provider ownership |
| 8 | **A11y: zero Semantics usage; unlabeled IconButtons; custom chip with no selected state; GestureDetector without role** | hardening | grep (0 matches); `expense_debug_page.dart:52,57`; `filter_chip.dart:20-44`; `expense_form.dart:88-89` | **high** | Enforce §7 topology + §8 semanticContract on every generated component; add `selectionCardinality`/`selected` binding to the chip pattern; validator: every interactive element has name+role |
| 9 | **Navigation: monolithic imperative redirect closure + static mutable globals; no declarative guard model** | IR shape / generator | `app_router.dart:39-41,111-196` | **high** | `navigation.guards[]` as declarative rules (auth/guest/registered/deep-link) compiled to redirect; forbid static mutable router state in generated code |
| 10 | **Model-extends-entity DTO pattern unrepresentable** | IR shape | `expense_models.dart:5` | **med** | `models[].extends: entityId` relation; `ModelGenerator` emits subclass models |
| 11 | **Query VOs with wire-coupled `toQueryParams()`** | IR shape | `transaction_query.dart:62-91` | **med** | Add `QueryModel` (filters, pagination, sort) with declared wire-param mapping; `DataSourceGenerator` emits params |
| 12 | **Cross-entity sync integrity rule falls outside §19 (cross-feature, DB I/O)** | IR shape / ownership | `cycle_sync_reconciler.dart:110-126` | **med** | Extend rule language with `effect:queueSyncOp` + declared cross-entity `consumes`; or formalize the extension-queue handoff for reconciler-class rules |
| 13 | **Exception-message-as-l10n-key convention not expressible** | IR shape / generator | `server_exception.dart:14-18`; `failure_mapper.dart:20-33` | **med** | `Failure.message` gains `kind: literal\|l10nKey`; `LocalizationGenerator` emits keys; UI generator emits `.tr()` |
| 14 | **`flutter_screenutil` global scaling absent from responsive model** | IR shape / generator | `rasheed_app.dart:117-119`; `.w/.h/.sp` everywhere | **med** | `ScreenModel.responsive` gains `scaling: screenutil\|none`; templates emit screenutil-aware layout |
| 15 | **Static in-code catalogs (categories list) have no IR slot** | IR shape | `core/utils/lists.dart`; `expense_remote_data_source.dart:106-112` | **med** | Add `catalogs[]` (static reference data) to IR; mappers reference catalog ids |
| 16 | **DB schema: raw SQL + empty `onUpgrade`; outbox offline-queue richer than `persistence` model** | IR shape / generator | `migrations.dart:7,17-21`; `outbox_table.dart:6-22` | **med** | `persistence` gains `offlineQueue{statuses, attempts, retryAt, lastError}`; `PersistenceGenerator` emits schema + migrations from IR |
| 17 | **Forms: validation in cubit state getters, not Form validators; no field↔error binding** | IR shape / generator | `expense_form_state.dart:55-57`; `expense_form.dart:57-72` | **med** | `FormModel.field.errorBinding` (aria-describedby equivalent); UX validator checks error linkage (§14.4.1.3 #2) |
| 18 | **`di.sl()` inside widgets; DI split between get_it and `ScopedBlocProviders`** | generator / validation | `all_expenses_screen.dart:35`; `scoped_providers.dart:30` | **low** | Arch-linter: forbid service-locator lookup in widgets; `DIGenerator` emits scoped-provider wiring from `di` graph |
| 19 | **Sentry DSN literals committed** | hardening | `app_strings.dart:4-7` | **low** | `SecretsModel` + `SecretsGenerator`; `SecurityValidator` fails on DSN/URL-with-credentials literals |
| 20 | **`error.toString()` into UI** | hardening | `app_router.dart:250`; `all_expenses_cubit.dart:175` | **low** | Error-model rule: UI never renders raw exception text; `FailureMapper` only |

---

## 6. "What the IR must add" list

Named as DESIGN.md sections would be:

1. **§2.1 `models[].extends`** — model-extends-entity DTO relation (gap 10).
2. **§2.1 `models[].fields[].acceptedKeys` + `parseMode: strict|lenient`** — tolerant-alias serialization (gap 1).
3. **§2.1 `datasources[].envelopeVariants[]`** — ordered multi-shape envelope unwrap per endpoint (gap 2).
4. **§2.1 `catalogs[]`** — static reference-data constants (gap 15).
5. **§2.1 `queries[]`** — query VOs with declared wire-param mapping (gap 11).
6. **§2.1 `repositories[].returnShape: stream|cacheThrough`** — cache-flag wrapper types (gap: `TransactionsPage`).
7. **§2.1 `useCases[].steps[]`** — multi-step orchestration workflows (gap: `AddExpenseUseCase`).
8. **§2.1 `stateMachines[].idiom: sealed|enumStatus|abstract`** — the dominant enum-status state shape (gap 6).
9. **§2.1 `stateMachines[].lifecycle{cancellation, ownership}`** — request tokens vs subscription cancel; provider vs manual close (gap 7).
10. **§2.1 `navigation.guards[]`** — declarative guard rules replacing the monolithic redirect closure (gap 9).
11. **§2.1 `localization.messagesAsKeys`** — exception-message-as-l10n-key convention (gap 13).
12. **§2.1 `theme.tokens.source: existing-constants`** — token extraction path for legacy hardcoded palettes (gap 3).
13. **§2.1 `observability.releaseSink`** — mandatory release-mode error sink (gap 4).
14. **§2.1 `persistence.offlineQueue{statuses, attempts, retryAt, lastError}`** — outbox-shaped offline queue (gap 16).
15. **§10.1 third generation strategy: "enum-status state"** — alongside observable-notifier and sealed-events (gap 6).
16. **§10 plugins: `hydrated_bloc`** — persistence strategy for state (gap: 6 HydratedCubits).
17. **§17 `SerializationFailure{endpoint, expectedShape, actualShape, raw}`** — the missing taxonomy slot (gap 5).
18. **§19 rule-language: `effect:queueSyncOp` + cross-entity `consumes`** — reconciler-class rules (gap 12).
19. **§14.4.1.2 `selectionCardinality` + `selected` binding on custom chips** — the chip-without-selected-state class (gap 8).
20. **§14.4.3 `ScreenModel.responsive.scaling: screenutil|none`** — screenutil-aware layout emission (gap 14).

---

## Top 5 gaps

The five highest-severity findings, in order: **(1)** the design's v3.2 per-endpoint typed parser is incompatible with this codebase's tolerant multi-alias parsing (`detailed_expense_response.dart:73-178`) and its shared multi-shape envelope unwrap with silent `[]` fallback (`expense_remote_data_source.dart:41-52`) — the IR must gain `acceptedKeys`/`parseMode` and `envelopeVariants` or regeneration will break live endpoints; **(2)** there is no design-token layer at all — ~97 hardcoded colors and inline `ThemeData` (`app_colors.dart`, `rasheed_app.dart:145-154`) mean the ThemeModel has nothing to bind to and the arch-linter's "no raw constants" rule would fail the entire app; **(3)** observability is debugPrint-only (`logger.dart:4-26`) with app-level Failure paths never reaching a release sink, directly violating §21's release-safe-by-default; **(4)** the state idiom is single-class-plus-enum-status rather than sealed states (only one `sealed class` in the codebase), so the sealed-events strategy and its exhaustiveness lints mis-model the dominant pattern; and **(5)** accessibility is structurally absent — zero `Semantics` usage anywhere, unlabeled `IconButton`s, and a custom chip with no selected state (`filter_chip.dart:20-44`) — meaning the §7/§8 semantic-contract guarantees have no existing pattern to map onto and every generated screen would need semantics emitted from scratch.
