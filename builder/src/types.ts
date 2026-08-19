import { Provenance } from "./provenance";

export type PrimitiveType =
  | "String"
  | "int"
  | "double"
  | "bool"
  | "DateTime"
  | "enum"
  | "List"
  | "reference";

export interface Field {
  name: string;
  type: PrimitiveType;
  of?: string; // item type for List, or referenced entity name for reference
  enumValues?: string[];
  required?: boolean;
  nullable?: boolean;
  default?: string | number | boolean | null;
  semanticType?: string;
  // P7-L1: ISO 4217 code (e.g. "SAR") — required companion to `semanticType: "Money"`. A money
  // field is never emitted as `double`: the entity/model/form/screen/repo-seed/rule generators
  // all special-case `semanticType === "Money"` into the generated `Money` value object (integer
  // minor units + this code), before the generic single-primitive VO fallback ever runs.
  currency?: string;
  // L3: marks a field as holding sensitive data (SSN, salary, card number, ...) — export.ts's
  // header-building excludes it from any CSV/JSON export regardless of `export:` being set on the
  // list screen; the `[export]` gate re-asserts this on the generated output. Explicit marker, not
  // a name-pattern guess (same reasoning `semanticType: "Money"` is explicit, not inferred from a
  // field named "amount") — additive, absent = not secret (today's behavior, byte-identical).
  secret?: boolean;
  // V1.1: explicit IR-authored hint that an enum field is a genuine multiple-choice value (a quiz
  // answer, a picker, ...), not a descriptive category — operations.ts's fieldRole() resolves it
  // to FieldRole "choice" (ChoiceChip everywhere a status/priority enum already renders as one)
  // BEFORE any name-list heuristic runs. Same explicit-marker pattern as `secret`/`semanticType`
  // above: only present = only true, absent = today's behavior (byte-identical for every field
  // that never sets it, i.e. every field in every currently-committed app).
  role?: "choice";
}

export interface EntityModel {
  name: string;
  identity?: { field: string };
  fields: Field[];
  equality?: "identity" | "full" | "none";
  immutability?: boolean;
  // L3: this entity's create/update/delete mutations are recorded to the app-wide audit log
  // (core/audit.dart's AuditLog). Additive — absent = no audit trail, byte-identical output.
  // Requires `attributes.auth` (an audit entry's `actor` is the signed-in Session's actorId; an
  // audit log without a real identity source is a compliance feature that lies about who acted) —
  // enforced by the `[audit]` gate, not silently assumed.
  audited?: boolean;
  // P2 (INTERFACE_PATTERN_CONTRACT.md §4, grill C4): this entity's own declared primary
  // human-readable identifier — the ONE explicit semantic composition.ts's `searchFor` selector
  // is allowed to read (never a `title`/`name`/`label` name-guess). References one of this
  // entity's own `fields[].name`; must resolve to a `String`-typed field or the selector treats
  // it as absent (defensive, same "resilient to a typo'd IR" posture `compositionFor`'s unknown-
  // archetype fallback takes). Additive — absent = no search on this entity's list screen,
  // byte-identical output.
  primaryDisplayField?: string;
}

export interface EnumModel {
  name: string;
  values: string[];
}

export type Invariant =
  | { kind: "min"; value: number }
  | { kind: "max"; value: number }
  | { kind: "nonEmpty" }
  | { kind: "regex"; value: string };

export interface ValueObjectModel {
  name: string;
  baseType: "String" | "int" | "double" | "DateTime";
  invariants?: Invariant[];
}

export interface FeatureModel {
  name: string;
  entities: EntityModel[];
  enums?: EnumModel[];
  valueObjects?: ValueObjectModel[];
  repositories?: RepositoryModel[];
  models?: ModelModel[];
  states?: StateModel[];
  queries?: QueryModel[];
  wrappers?: WrapperModel[];
  useCases?: UseCaseModel[];
  datasources?: DatasourceModel[];
  repositoryImpls?: RepositoryImplModel[];
  screens?: ScreenModel[];
  stateMachines?: StateMachineModel[];
  forms?: FormModel[];
  businessRules?: RuleModel[];
  attributes?: AppAttributes;
}

// MF1: an app-level IR spanning multiple features, each rooted at its own
// `lib/features/<feature.name>/` folder — the single-feature `FeatureModel` above stays the only
// shape most samples ever need; this is additive, detected by index.ts via `"features" in ir`.
// A feature's own `attributes` (if set) plays no role here — only the app-level `attributes` feed
// architecture scoring (one shared stateManagement/DI/routing/persistence decision for the app).
export interface AppModel {
  schemaVersion: string;
  name: string;
  attributes?: AppAttributes;
  features: FeatureModel[];
}

// MF2: one demo account shown on the generated login screen. `actorId` is the stable identity the
// signed-in actor's created rows claim when the app is tenant-scoped; `tenantId` is the data
// boundary every tenant-scoped repository filters on and stamps (see repository_impl.ts).
export interface PersonaModel {
  name: string;
  role: string; // must be one of `roles`
  actorId: string;
  tenantId: string;
}

// MF2: multi-user auth + roles + tenant scoping (app-level capability, § CAPABILITIES MF2).
//
// `roles` is the authoritative role vocabulary — the generated router emits one home route per
// role. `home` maps EVERY role to the ENTITY NAME whose list screen is that role's landing route
// (works for both single-feature and multi-feature apps — routes are resolved from kebab(entity)).
// `allow` (optional) lists, per role, ADDITIONAL entities whose list/detail/form routes that role
// may also access (a path is reachable iff it starts with the role's home prefix or an allowed
// entity prefix). A role with no allow entry can only reach its own home area — this is what the
// generated guardPath() asserts and what the generated auth_test regression-guards.
//
// `personas` (optional) pins the demo accounts; when absent the generator derives one persona per
// role deterministically (operations.ts authPersonas — 0% LLM). `loginEntity` (optional) names an
// entity that may expose the users as a visible directory; it has no effect on the login flow.
export interface AuthModel {
  roles: string[];
  home: Record<string, string>; // role -> entity whose list screen is that role's home
  allow?: Record<string, string[]>; // role -> additional reachable entities
  personas?: PersonaModel[];
  loginEntity?: string;
}

// MF5: budget/quota (app-level capability, § CAPABILITIES MF5). Explicit IR, not inferred: unlike
// MF4's split (an unambiguous FK+`percent` structural signature), budget's three Money roles
// (limit/committed/actual) have no single naming convention every domain would reuse — Ledgerly's
// meal budget and work_auth's visa quota don't want to be forced onto identical field names — so
// this points at whichever field names the entity author already chose, the same shape MF3's
// `attachments` flag uses for "no clean structural signature." `scope` (BudgetLine's per-record
// label, e.g. "Meals"/"Riyadh") is deliberately NOT a field pointer here — it's read from the
// budget entity's own descriptive String field at generation time (operations.ts's
// budgetScopeField, same "first non-identity String field" fallback screen.ts's pickTitle uses),
// so declaring a budget needs no second "label field" config. `period` is accepted and carried in
// the IR for forward-compat but drives no rollover/reset logic this iteration — a documented gap,
// not silently approximated (mirrors split.ts's percent-only-this-iteration precedent).
export interface BudgetModel {
  entity: string; // the budget-holder entity name (e.g. "MealBudget", "VisaQuota")
  limitField: string; // Money field: the ceiling
  committedField: string; // Money field: submitted/pending sum
  actualField: string; // Money field: approved/actual sum
  scope?: "category" | "project" | "team" | string; // informational grouping tag for UI copy only
  period?: "monthly" | "quarterly" | "yearly" | "none"; // informational only — no rollover logic yet
}

/** Explicit IR attributes consumed by the §5.2 pattern-selection scoring function. */
export interface AppAttributes {
  refreshCadence?: "static" | "occasional" | "frequent" | "realtime";
  density?: "compact" | "comfortable";
  // D1 (DESIGN_OPTS §1 O1.3): dark mode at the app root. "dark" forces a dark scheme, "system"
  // follows the OS, "light" (absent) preserves today's always-light rendering. Consumed by
  // generators/project.ts (main.v1 `themeMode:`), generators/infra.ts (buildThemeDark) and
  // validate.ts's [theme] gate — informational for scoring, never weighed. Additive — absent =
  // light, byte-identical output.
  themeMode?: "light" | "dark" | "system";
  // D1 (DESIGN_OPTS §1 O1.2): brand seed — "#RRGGBB" hex (leading # optional). Seeds
  // ColorScheme.fromSeed via AppColors.primary in core/theme.dart (generators/infra.ts). Additive
  // — absent or malformed = today's token teal (0xFF0D9488), byte-identical output.
  brandSeedColor?: string;
  responsiveness?: "mobile" | "responsive";
  offlinePolicy?: "none" | "cache" | "offline-first";
  permissionScope?: "none" | "basic" | "sensitive";
  stateManagement?: StateManagementProvider; // explicit provider override (wins over scoring)
  persistence?: PersistenceKind; // explicit DB override (wins over scoring)
  auth?: AuthModel; // MF2: multi-user auth + roles + tenant scoping (additive — absent = no auth)
  attachments?: boolean; // MF3: attachment + OCR port (additive — absent = no core/attachment.dart)
  budget?: BudgetModel; // MF5: budget/quota (additive — absent = no core/budget.dart)
  // L4: l10n + RTL. "en"/"ar" pin a single boot locale; "both" supports switching (boots "en",
  // Arabic is the opt-in RTL option — MaterialApp.supportedLocales carries both either way).
  // L4.1: "enArFr" is the tri-locale mode (en+ar+fr all in supportedLocales, boots from the
  // platform/browser locale like "both" already does — no fixed `locale:` line either).
  // Additive — absent = today's flat single-locale AppStrings, byte-identical output; "en"/"ar"/
  // "both" stay byte-identical too (the "enArFr"-only additions are gated behind that value).
  locale?: "en" | "ar" | "both" | "enArFr";
  // MF6: offline outbox — repo create/update/delete write-ahead-enqueue an OutboxMessage before
  // mutating the in-memory list. Additive — absent = today's output byte-identical.
  outbox?: boolean;
  // SwiftUI target (S1): the generation target. A GENERATION TARGET — which rendering target this
  // generation invocation produces — not an application capability. Consumed only by the
  // composition root (index.ts dispatch) and validate.ts (target-specific gates); it must never be
  // read by a generated app, business rule, or screen. Absent = "flutter" (byte-identical output).
  // `targets[]` (multi-target in one invocation) is explicitly reserved for a future mode.
  platform?: "flutter" | "swiftui";
}

export type GenerationTarget = NonNullable<AppAttributes["platform"]>;

export type StateManagementProvider = "none" | "bloc" | "riverpod";

export type PersistenceKind = "none" | "sql" | "nosql";

export type OperationKind = "list" | "get" | "create" | "update" | "delete";

// Faithful operation signature: arbitrary return type + params (positional/named).
export interface OperationParam {
  name: string;
  type: string; // Dart type (e.g. "String", "int", "TransactionQuery")
  required?: boolean; // for named params
  default?: string; // Dart default expr (e.g. "1", "50", "false")
  named?: boolean; // default true (named); false = positional
}

export interface OperationModel {
  name: string;
  returns: string; // Dart return type (e.g. "Future<TransactionEntity>", "Stream<TransactionsPage>", "Future<void>")
  params: OperationParam[];
}

export interface RepositoryModel {
  name: string;
  operations: OperationModel[];
}

// A "data class" field (plain class, no identity).
export interface DataField {
  name: string;
  type: string; // Dart type
  default?: string; // Dart default expr
}

export interface QueryModel {
  name: string; // e.g. TransactionQuery
  fields: DataField[];
  paramMap?: Record<string, string>; // field -> wire param name (for toQueryParams, v3.3)
}

export interface WrapperModel {
  name: string; // e.g. TransactionsPage
  fields: DataField[];
}

export interface UseCaseModel {
  name: string; // e.g. ListTransactions
  repository: string; // repository contract name
  operation: string; // repository operation to call
  paramType: string; // input type (Dart) e.g. "TransactionFilter" or "NoParams"
  returnType: string; // output type (Dart) e.g. "List<Transaction>"
}

export interface DatasourceModel {
  name: string; // e.g. TransactionRemoteDataSource
  endpoints: EndpointModel[];
}

export interface EndpointModel {
  name: string; // e.g. fetchTransactions
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  path: string; // e.g. "/transactions"
  returns: string; // Dart type returned (DTO) e.g. "List<Map<String, dynamic>>"
}

export interface RepositoryImplModel {
  name: string; // e.g. TransactionRepositoryImpl
  contract: string; // repository contract name it implements
  datasource: string; // datasource name it uses
}

export interface ScreenModel {
  name: string; // e.g. TransactionListScreen
  entity: string; // entity shown
  type: string; // composition archetype id: "list" | "detail" | "wizard" | "sections" | ... (open set, see composition.ts)
  state: string; // state/cubit name
  hero?: string; // optional: field name or headline to render as the screen's focal point
  steps?: WizardStep[]; // P8-W1: only meaningful when type === "wizard" (composition archetype "wizard")
  // L3: only meaningful on a "list" screen. Adds an Export action that computes CSV/JSON of the
  // currently-listed rows (core/export.dart's toCsv/toJson) and stamps them `exported: true` —
  // after which the immutability rule blocks further edits (form saveGuard + repo-impl reject).
  // Requires the shown entity to declare a `bool` field literally named `exported` — enforced by
  // the `[export]` gate (mirrors [split]'s categoryField requirement), not silently ignored.
  export?: "csv" | "json" | "csv+json";
  // S1 (SPIKE_S1_REPORT.md §14.1): per-screen visual-intent fragment — feeds composition.ts's
  // deterministic `visualFor` scoring selector only, never selects a widget/asset directly (the one
  // rule that cannot break, per the S1 brief). Additive — absent = today's output byte-identical.
  // `AppAttributes.density` stays app-level (D1) and is NOT duplicated here.
  visualStyle?: VisualStyleModel;
  // S2 (SPIKE_S2_REPORT.md §14.1): declarative section-list layout — only meaningful when
  // type === "sections" (composition archetype "sections", validate.ts's [sections] gate enforces
  // the pairing; a "sections" screen with no sections, or sections on any other archetype, is a
  // gate ERROR, never a silent fallback). Order IS the hierarchy — sections render in declared
  // sequence, never coordinates/columns/width/height/x/y (composition.ts's sectionsFor decides the
  // per-type component mapping; screen.ts applies it verbatim).
  sections?: SectionModel[];
}

// S2 (SPIKE_S2_REPORT.md §14.1, D1): closed v1 section-type vocabulary — any other value is a
// schema hard-reject (screen.schema.json), never a warn-and-fallback (a closed vocabulary must
// hard-abort on an unknown value, or the schema teeth silently rot — see the spike's rejected
// alternatives §15). `emphasis`/`targetId` are deliberately NOT admitted anywhere in this shape
// (D5 — the hero's prominence is its type + position + heroScale, no separate focal-point field).
export type SectionType =
  | "header"
  | "search"
  | "hero"
  | "promoBanner"
  | "productGrid"
  | "horizontalCards"
  | "sectionHeader"
  | "section"
  | "divider"
  | "floatingCart";

// `children` is allowed ONLY on `type: "section"` (a grouping container), one level deep, leaves
// only (no recursion) — keeps the renderer a simple depth-1 table (SPIKE_S2_REPORT.md §14.1). No
// width/height/columns/aspectRatio/padding/x/y anywhere — every extent the renderer emits is a
// generator-side AppTokens.*/AppRadius.*/AppSpacing.* token, never an IR-side literal.
export interface SectionModel {
  id: string;
  type: SectionType;
  title?: string;
  children?: SectionModel[];
  // V1.1: only meaningful on a `floatingCart` section — a route to navigate to (e.g.
  // "/quiz-run/wizard") instead of the decorative "Add to cart" SnackBar. Additive — absent =
  // today's cart FAB, byte-identical. `title` doubles as the FAB's extended label when set.
  target?: string;
}

// S1 (SPIKE_S1_REPORT.md §14.1): v1 closed enums — `imagery` is deferred to S3 (no consumer before
// the asset ladder) and `emphasis` to S2 (needs `sections[]`/`targetId` to resolve); do not add
// either here until that slice lands (D2/D3).
export type VisualHierarchy = "soft" | "balanced" | "strong";
export type VisualCornerRadius = "sharp" | "soft" | "rounded" | "pill";
export type VisualPersonality = "professional" | "friendly" | "premium" | "playful" | "minimal";

// Reuses the existing Provenance envelope (provenance.ts) — D4: a bespoke fragment-carried
// provenance type was rejected (duplicates the v2-contract-standardized envelope). Each value is
// individually stamped/attested so `[visualIntent]` can block generation on a per-value basis.
export interface VisualStyleValue<T> extends Provenance {
  value: T;
}

export interface VisualStyleModel {
  hierarchy?: VisualStyleValue<VisualHierarchy>;
  cornerRadius?: VisualStyleValue<VisualCornerRadius>;
  personality?: VisualStyleValue<VisualPersonality>;
}

// P8-W3: an inline branching condition — `field` names an entity/step field, compared against a
// Dart-literal-ready `value` (same convention as RuleCondition.value, §19). Used by
// `WizardStep.when` alongside the alternative "name a RuleModel" form.
export interface WizardCondition {
  field: string;
  op: ">=" | "<" | "==";
  value: string;
}

// P8-W1/W3: one step of a wizard screen.
// `field` (optional) names a single entity field this step collects; `fields` (optional, P8-W4)
// names several (a step can declare one or the other — `field` is a convenience shorthand for a
// one-element `fields`). A step with neither is an info/review step: it renders a read-only
// summary of every field collected so far and always advances.
// `validate` (optional) names a RuleModel (§19) evaluated against the in-progress draft entity as
// the "can advance from this step?" guard; absent `validate` on a field-collecting step defaults
// to a required-filled check (all of its fields non-null/non-empty).
// `when` (optional, P8-W3) gates whether the step is shown at all — either an inline
// `WizardCondition` or the name of a RuleModel evaluated against the draft entity. A step whose
// `when` doesn't hold is skipped automatically by next()/back()/jumpTo() — never a dead end.
export interface WizardStep {
  id: string;
  title: string;
  field?: string;
  fields?: string[];
  validate?: string;
  when?: WizardCondition | string;
}

export interface TransitionModel {
  from: string;
  event: string;
  to: string;
  guard?: string; // guard rule name (business rule ref)
}

export interface StateMachineModel {
  name: string; // e.g. Order
  states: string[];
  events: string[];
  transitions: TransitionModel[];
}

export interface FormFieldModel {
  name: string;
  type: "text" | "email" | "number" | "date";
  required?: boolean;
}

export interface FormModel {
  name: string;
  fields: FormFieldModel[];
}

// Business rule (formal, closed language — DESIGN §19). Deterministic rule representation.
// BREL additive slice (design/flutter-app-builder/research/BREL_DECISION.md §5 "ADOPT"): the
// 9 string/null/collection operators below are additive to the union. They are schema-permitted
// only inside the new `expression` grammar's ComparisonExpression.op (builder/schemas/rule.schema.json) —
// the legacy flat `RuleCondition.operator` enum in that same schema intentionally stays the
// original 8, so no existing generator branch (generators/rule.ts's conditionExpr) needs to change
// to stay byte-identical. builder/src/expression.ts's compileExpression is the only place that
// compiles the new 9 to Dart.
export type RuleOperator =
  | ">=" | "<=" | ">" | "<" | "==" | "!=" | "contains"
  | "daysSince>" | "daysSince<" // temporal, scoped to decision-table rows only (§25 Phase 0 slice 3)
  | "startsWith" | "endsWith" | "matches" | "in" | "notIn"
  | "isNull" | "isNotNull" | "isEmpty" | "isNotEmpty";

// BREL additive slice — optional expression-tree alternative to `conditions[]` for logical
// combinators (`and`/`or`/`not`) and the fn registry (`daysSince`/`daysUntil`/`isBefore`/`isAfter`/
// `isBetween`). Canonical AST shape adopted from BREL_CHATGPT_ADDENDUM.md: nested
// Comparison(left, op, right) over ValueExpression, not the flat `{fn,args,op,value}` form —
// scales to `sum`/`length` later without special-casing (those stay REJECTED — §19:633 — this
// union deliberately has no quantifier/aggregate node). Flat input shapes (a plain
// `{field,operator,value}` RuleCondition, or `{fn,args,op,value}`) are accepted on input and
// normalized to this canonical nested shape by expression.ts's normalizeExpression before they
// ever reach a generator.
export type ValueExpression =
  | { field: string }
  | { value: string | number | boolean | (string | number)[] }
  | { fn: string; args: ValueExpression[] };

export interface ComparisonExpression {
  left: ValueExpression;
  op: RuleOperator;
  right: ValueExpression;
}

export interface LogicalAndExpression {
  and: RuleExpression[];
}

export interface LogicalOrExpression {
  or: RuleExpression[];
}

export interface LogicalNotExpression {
  not: RuleExpression;
}

// A bare fn call used directly as a boolean predicate (isBefore/isAfter/isBetween) rather than
// nested inside a Comparison's left/right (which is for VALUE-producing fns like daysSince/daysUntil).
export interface PredicateCallExpression {
  fn: string;
  args: ValueExpression[];
}

export type RuleExpression =
  | ComparisonExpression
  | LogicalAndExpression
  | LogicalOrExpression
  | LogicalNotExpression
  | PredicateCallExpression;

// L2: severity a rule's firing is scored at — presence enrolls a FLAT rule (no `rows`) in the
// generated policy engine (see generators/policy.ts). A rule with no `severity` keeps today's
// plain boolean/decision-table behavior untouched — this is the entire backward-compat story:
// existing rules (LargeClaim, HighPriority, ...) are unaffected until an IR author opts a rule in.
export type PolicySeverity = "autoApprove" | "warn" | "requireJustification" | "block";

export interface RuleModel {
  name: string; // e.g. promotionEligibility
  entity: string; // entity the rule acts on
  conditions: RuleCondition[]; // all must hold (AND) — flat form. Empty array when `expression`
  // is used instead (same additive-required-array precedent as `rows` — see business_rule_agent.ts's
  // systemPrompt: "conditions": [] is still required even when using "rows").
  result: string; // flat outcome, or the default outcome when no decision-table row matches
  rows?: DecisionTableRow[]; // decision-table form (additive, optional — §19)
  // BREL additive slice: an optional expression-tree alternative to `conditions[]`, for or/not/fn
  // (see RuleExpression doc above). Mutually exclusive with a non-empty `conditions` — a rule uses
  // ONE of the two condition forms. Ignored by the decision-table (`rows`) path.
  expression?: RuleExpression;
  severity?: PolicySeverity; // L2, flat-form rules only — see PolicySeverity doc above
  message?: string; // L2 — plain-language verdict message shown to the user; required when severity is set ([verdict] gate)
  // V1.2: points this rule contributes when it fires — additive, absent = 0 (today's behavior for
  // every rule that never sets it). Only consumed by a wizard final step's gamified score summary
  // (operations.ts's gamifiedWizardRules + screen.ts's gamifiedResultBlock) — a policy rule that
  // isn't reachable from a wizard's own step-collected fields never reads this.
  points?: number;
}

export interface DecisionTableRow {
  outcome: string;
  conditions?: RuleCondition[]; // all must hold (AND) within this row
}

export interface RuleCondition {
  field: string;
  operator: RuleOperator;
  value: string; // literal, compared against the field (JSON literal form); for daysSince* it's the day count
}

export interface ModelModel {
  name: string;
  entity: string; // entity this DTO maps to
  jsonKeys?: Record<string, string>; // fieldName -> primary json key (default = fieldName)
  acceptedKeys?: Record<string, string[]>; // fieldName -> alternate json keys (lenient parse, v3.3)
}

export interface StateField {
  name: string;
  type: string; // Dart type (e.g. "bool", "String", "List<TransactionEntity>", "TransactionFilter")
  default?: string; // Dart default expression (e.g. "false", "const []", "50")
}

export interface StateModel {
  name: string; // e.g. AllExpenses
  entity: string; // entity of the list items
  statuses?: string[]; // default: initial, loading, success, failure
  extraFields?: StateField[]; // additional state fields beyond status/transactions/errorMessage
}

// P5/D2 Slice 2 (SPIKE_P5_D2_REPORT.md §14.1): the state-model-conditional Loading/Error/Empty
// placement decision for one screen — composition.ts's `statePlacementFor` is the single owner
// (mirrors P4's ActionSpec posture); screen.ts only ever renders the payload it's handed, never
// re-derives it. `null` (no map entry) means the screen's state model declares none of the triad
// (today: the wizard archetype, whose flow-status field is `wizardStatus`, not `status`) — the
// screen renders no loading/failure branch at all, fixing the wizard compile bug (§3.3).
export interface StatePlacementSpec {
  flowField: string; // the state model's flow-status field name driving loading/error (e.g. "status")
  loading: boolean;  // flowField's enum declares a "loading" member
  error: boolean;    // flowField's enum declares "failure" AND the state declares errorMessage
  empty: boolean;    // the state has a backing collection (list archetype) — Slice 3 renders this
  emptyCta: boolean; // empty AND crudFormTargets(ir).get(entity) has create — Slice 3 renders this
  retry: boolean;    // error AND the state's Cubit/Notifier has load() — Slice 3 renders this
  refresh: boolean;  // empty AND the state's Cubit/Notifier has load() — Slice 3 renders this
}

export type DartTypeMap = Record<PrimitiveType, string>;
