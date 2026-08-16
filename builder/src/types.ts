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
}

export interface EntityModel {
  name: string;
  identity?: { field: string };
  fields: Field[];
  equality?: "identity" | "full" | "none";
  immutability?: boolean;
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
  responsiveness?: "mobile" | "responsive";
  offlinePolicy?: "none" | "cache" | "offline-first";
  permissionScope?: "none" | "basic" | "sensitive";
  stateManagement?: StateManagementProvider; // explicit provider override (wins over scoring)
  persistence?: PersistenceKind; // explicit DB override (wins over scoring)
  auth?: AuthModel; // MF2: multi-user auth + roles + tenant scoping (additive — absent = no auth)
  attachments?: boolean; // MF3: attachment + OCR port (additive — absent = no core/attachment.dart)
  budget?: BudgetModel; // MF5: budget/quota (additive — absent = no core/budget.dart)
}

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
  type: string; // composition archetype id: "list" | "detail" | "wizard" | "dashboard" | ... (open set, see composition.ts)
  state: string; // state/cubit name
  hero?: string; // optional: field name or headline to render as the screen's focal point
  steps?: WizardStep[]; // P8-W1: only meaningful when type === "wizard" (composition archetype "wizard")
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
export type RuleOperator =
  | ">=" | "<=" | ">" | "<" | "==" | "!=" | "contains"
  | "daysSince>" | "daysSince<"; // temporal, scoped to decision-table rows only (§25 Phase 0 slice 3)

// L2: severity a rule's firing is scored at — presence enrolls a FLAT rule (no `rows`) in the
// generated policy engine (see generators/policy.ts). A rule with no `severity` keeps today's
// plain boolean/decision-table behavior untouched — this is the entire backward-compat story:
// existing rules (LargeClaim, HighPriority, ...) are unaffected until an IR author opts a rule in.
export type PolicySeverity = "autoApprove" | "warn" | "requireJustification" | "block";

export interface RuleModel {
  name: string; // e.g. promotionEligibility
  entity: string; // entity the rule acts on
  conditions: RuleCondition[]; // all must hold (AND) — flat form
  result: string; // flat outcome, or the default outcome when no decision-table row matches
  rows?: DecisionTableRow[]; // decision-table form (additive, optional — §19)
  severity?: PolicySeverity; // L2, flat-form rules only — see PolicySeverity doc above
  message?: string; // L2 — plain-language verdict message shown to the user; required when severity is set ([verdict] gate)
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

export type DartTypeMap = Record<PrimitiveType, string>;
