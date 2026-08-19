// Repository-operation classification — shared, deterministic, depends only on types.ts and
// naming.ts (both dependency-free themselves). Single source of truth for "what CRUD kind is this
// operation" so scoring.ts (persistence selection) and repository_impl.ts (CRUD codegen) never
// drift on the same heuristic.
import { OperationModel, OperationKind, RepositoryModel, FeatureModel, ScreenModel, WizardStep, EntityModel, Field, RuleModel, AuthModel, PersonaModel, BudgetModel, GenerationTarget } from "./types";
import { capitalize, camelize } from "./naming";

// The entity a repository's `list` operation returns (Future<List<Task>> -> "Task").
export function listEntityName(repo: RepositoryModel | undefined): string | null {
  const op = repo?.operations.find((o) => /^Future<List<[A-Z]\w*>>$/.test(o.returns));
  return op ? op.returns.match(/List<([A-Z]\w*)>/)?.[1] ?? null : null;
}

export function findRepoForEntity(repositories: RepositoryModel[] | undefined, entityName: string): RepositoryModel | undefined {
  return (repositories ?? []).find((r) => listEntityName(r) === entityName);
}

// Deterministic operation-kind classifier: name prefix AND return/param shape must BOTH match —
// conservative on purpose so custom business operations (submitFeedback, restock, watchTransactions,
// ...) never get force-fit into a CRUD bucket they don't structurally match. This is what fixes the
// pre-existing bug where a `createTask(Task) -> Future<Task>` op was mis-picked as the "get" op
// (same return shape) since the old heuristic never looked at the operation's name.
export function classifyOperation(op: OperationModel, entityName: string): OperationKind | null {
  const n = op.name.toLowerCase();
  const singleReturn = op.returns === `Future<${entityName}>`;
  const listReturn = op.returns === `Future<List<${entityName}>>`;
  const voidReturn = op.returns === "Future<void>";
  const takesEntity = op.params.some((p) => p.type === entityName);

  if (/^list/.test(n) && listReturn) return "list";
  if (/^get/.test(n) && singleReturn) return "get";
  if (/^(create|add)/.test(n) && takesEntity && (singleReturn || voidReturn)) return "create";
  if (/^(update|edit)/.test(n) && takesEntity && (voidReturn || singleReturn)) return "update";
  if (/^(delete|remove)/.test(n) && !takesEntity && voidReturn) return "delete";
  return null;
}

// All CRUD kinds a repository implements for the given entity, keyed by kind -> operation.
export function crudOperations(repo: RepositoryModel, entityName: string): Partial<Record<OperationKind, OperationModel>> {
  const out: Partial<Record<OperationKind, OperationModel>> = {};
  for (const op of repo.operations) {
    const k = classifyOperation(op, entityName);
    if (k && !out[k]) out[k] = op;
  }
  return out;
}

// "Full CRUD surface" (§5.2 persistence scoring input): create + update + delete all present.
export function hasFullCrud(repo: RepositoryModel, entityName: string): boolean {
  const kinds = crudOperations(repo, entityName);
  return !!(kinds.create && kinds.update && kinds.delete);
}

// Single naming source for the synthesized create/edit form screen class (used by index.ts,
// symbols.ts, route.ts, and screen.ts — never hand-typed at each call site).
export function crudFormScreenName(entity: string): string {
  return `${entity}FormScreen`;
}

export interface CrudFormTarget {
  entity: string;
  screen: ScreenModel; // the "list" screen this form is reached from
  create: OperationModel;
  update: OperationModel;
  delete?: OperationModel;
}

// Entities that get a synthesized create/edit form screen (§5.2-F1: "generated from the entity
// fields"). Gate: the entity's repository declares both create and update (delete is carried
// along when present, but an entity can be creatable/editable without being deletable). Keyed by
// entity name so symbols.ts / index.ts / route.ts / screen.ts share one answer and never drift —
// each of those four needs to know "does this entity get a form screen" independently.
export function crudFormTargets(ir: FeatureModel): Map<string, CrudFormTarget> {
  const out = new Map<string, CrudFormTarget>();
  for (const sc of ir.screens ?? []) {
    if (sc.type !== "list" || out.has(sc.entity)) continue;
    const repo = findRepoForEntity(ir.repositories, sc.entity);
    if (!repo) continue;
    const kinds = crudOperations(repo, sc.entity);
    if (kinds.create && kinds.update) {
      out.set(sc.entity, { entity: sc.entity, screen: sc, create: kinds.create, update: kinds.update, delete: kinds.delete });
    }
  }
  return out;
}

// LM6: a "review queue" entity — a status-role enum field (fieldRole, e.g. Approval.decision)
// whose repo declares `update` but has no detail screen and no full create+update CRUD form
// (crudFormTargets requires both create+update — an update-only repo, like ApprovalRepository,
// never qualifies there). Single source of truth shared by screen.ts (renders the quick-decision
// buttons on the list row — nowhere else for the action to live, since there's no row target to
// navigate to) and test.ts (the regression test asserting the tap actually flips the field).
export interface QuickDecisionTarget {
  entity: string;
  screen: ScreenModel;
  field: Field;
  enumType: string;
  enumValues: string[];
}

export function quickDecisionTargets(ir: FeatureModel): Map<string, QuickDecisionTarget> {
  const out = new Map<string, QuickDecisionTarget>();
  const crudTargets = crudFormTargets(ir);
  for (const sc of ir.screens ?? []) {
    if (sc.type !== "list" || out.has(sc.entity) || crudTargets.has(sc.entity)) continue;
    if ((ir.screens ?? []).some((d) => d.entity === sc.entity && d.type === "detail")) continue;
    const repo = findRepoForEntity(ir.repositories, sc.entity);
    if (!repo) continue;
    const kinds = crudOperations(repo, sc.entity);
    if (!kinds.update) continue;
    const entity = (ir.entities ?? []).find((e) => e.name === sc.entity);
    if (!entity) continue;
    const roleCtx: FieldRoleContext = { identityField: entity.identity?.field ?? "id", entityNames: (ir.entities ?? []).map((e) => e.name) };
    const field = entity.fields.find((f) => fieldRole(f, roleCtx) === "status");
    if (!field) continue;
    const enumType = field.of || capitalize(field.name);
    const enumDef = (ir.enums ?? []).find((e) => e.name === enumType);
    if (!enumDef || enumDef.values.length < 2) continue;
    out.set(sc.entity, { entity: sc.entity, screen: sc, field, enumType, enumValues: enumDef.values });
  }
  return out;
}

// P8-W2: the wizard-type screen bound to a given state (if any) — a state generates wizard
// fields/methods (currentStep, next/back/jumpTo, per-step setters, canAdvance) only when it's
// used by a "wizard" screen with a non-empty step list. Shared by state.ts and screen.ts so both
// agree on "is this state a wizard" without re-deriving the check.
export function findWizardScreen(ir: FeatureModel, stateName: string): ScreenModel | undefined {
  return (ir.screens ?? []).find((s) => s.state === stateName && s.type === "wizard" && !!s.steps?.length);
}

// A wizard step's collected fields (P8-W1/W4) — `fields` (multi-field) wins if present, else
// `field` (single) as a one-element list, else none (info/review step). Shared by state.ts
// (state shape + canAdvance) and screen.ts (rendering + the review-step summary) so both agree
// on what a step actually collects.
export function stepFields(st: WizardStep): string[] {
  return st.fields ?? (st.field ? [st.field] : []);
}

// P7-L1: a field is money-typed when it declares `semanticType: "Money"` — the single source of
// truth every generator (entity/model/crud_form/screen/repository_impl/rule/state) checks BEFORE
// falling through to the generic single-primitive value-object path, so Money's two-field shape
// (minorUnits + currency) never gets treated as a plain VO wrapper.
export function isMoneyField(f: { semanticType?: string }): boolean {
  return f.semanticType === "Money";
}

// Whether the IR declares any money field anywhere — gates conditional emission of the shared
// core/money.dart value object (index.ts/symbols.ts) so apps with no money never carry a dead file.
export function hasMoneyFields(ir: FeatureModel): boolean {
  return (ir.entities ?? []).some((e) => e.fields.some(isMoneyField));
}

// §5.2-F1/L1b: the entity fields crud_form.ts renders as editable inputs — excludes the identity
// field (generated on create, immutable on edit); only primitive-shaped types get a widget
// (reference/List are carried forward, not edited — see crud_form.ts's own doc comment). Shared
// with test.ts's generateCrudFlowTest so both agree on field order without drifting.
const CRUD_EDITABLE_TYPES = new Set(["String", "int", "double", "bool", "DateTime", "enum"]);
export function crudEditableFields(entity: EntityModel, identityField: string): Field[] {
  return entity.fields.filter((f) => f.name !== identityField && CRUD_EDITABLE_TYPES.has(f.type));
}

// Of the editable fields, the first one crud_form.ts renders as a `TextField` (String/int/
// double/Money/DateTime) — bool renders as a Checkbox, enum as a Dropdown, so a widget test's
// `find.byType(TextField).first` skips over those. L1b: test.ts needs this to know whether that
// first TextField is money-typed (decimal text -> minor units), since typing a plain string into
// it would silently produce `Money(minorUnits: 0, ...)` instead of the intended amount.
const CRUD_TEXT_FIELD_TYPES = new Set(["String", "int", "double", "DateTime"]);
// G2a: DateTime renders as a TextField too, but G2 made it `readOnly: true` (opens showDatePicker
// on tap, same as firstFocusBypassField's own DateTime exclusion above) — this function's only
// consumer, generateCrudFlowTest, types a plain string/decimal into whatever it returns, which a
// readOnly date field can't accept the same way. Excluded from the "first" pick so that test
// always lands on a field it can genuinely type into; DateTime fields still render as TextField
// (crud_form.ts is unaffected — this is purely about which field the flow test targets).
export function firstCrudTextField(entity: EntityModel, identityField: string): Field | undefined {
  return crudEditableFields(entity, identityField).find((f) => CRUD_TEXT_FIELD_TYPES.has(f.type) && f.type !== "DateTime");
}

// Bug A / RCA-002-ALL: every editable field crud_form.ts wires a gesture-bound
// FocusNode.requestFocus() bypass onto — EVERY field that renders a REAL (non-readOnly)
// keyboard-invoking TextField (String/int/double/Money — Money's underlying `type` is "double"),
// on BOTH create and edit routes. DateTime is excluded even though it's controller-backed: G2
// made it `readOnly: true` (opens a date picker on tap), so it never needs a keyboard at all;
// bool/enum render as Checkbox/Dropdown/ChoiceChip, never a text keyboard. Shared with test.ts's
// generated focus regression test so both agree on which fields carry the bypass without
// drifting.
const TEXT_KEYBOARD_TYPES = new Set(["String", "int", "double", "DateTime"]);
export function textInputBypassFields(entity: EntityModel, identityField: string): Field[] {
  return crudEditableFields(entity, identityField).filter((f) => TEXT_KEYBOARD_TYPES.has(f.type) && f.type !== "DateTime");
}

// Back-compat accessor for call sites that only ever cared about the first bypass target (e.g.
// FocusTestGenerator's "does this entity have ANY focusable field" gate) — the first element of
// textInputBypassFields, or undefined when the entity has none.
export function firstFocusBypassField(entity: EntityModel, identityField: string): Field | undefined {
  return textInputBypassFields(entity, identityField)[0];
}

// The ordered subset of crudEditableFields that render as a `TextField` in crud_form.ts's
// fieldWidget at all — String/int/double/Money (bypass-eligible) AND DateTime (readOnly, no
// bypass — opens a date picker instead). Shared with test.ts's generateFocusTest so it can locate
// each bypass field's position among `find.byType(TextField)` matches without re-deriving
// crud_form.ts's own field-type-to-widget mapping.
export function crudTextFieldWidgets(entity: EntityModel, identityField: string): Field[] {
  return crudEditableFields(entity, identityField).filter((f) => TEXT_KEYBOARD_TYPES.has(f.type));
}

// P8-W1/RCA-002-ALL: the wizard analog of textInputBypassFields — every text-input field
// (String/int/double/Money) collected across ALL of a wizard screen's steps, deduped by name (a
// field can be referenced by only one step, but stepFields is per-step so this collects across
// the whole flow the same way screen.ts's own allStepFieldNames does). DateTime/bool/enum
// excluded for the same reasons as the CRUD form. `entity` may be undefined for a malformed
// screen with no resolvable entity — returns empty rather than throwing.
function wizardStepFields(screen: ScreenModel, entity: EntityModel): Field[] {
  const names = Array.from(new Set((screen.steps ?? []).flatMap(stepFields)));
  return names.map((n) => entity.fields.find((f) => f.name === n)).filter((f): f is Field => !!f);
}

export function wizardTextInputFields(screen: ScreenModel, entity: EntityModel | undefined): Field[] {
  if (!entity) return [];
  return wizardStepFields(screen, entity).filter((f) => TEXT_KEYBOARD_TYPES.has(f.type) && f.type !== "DateTime");
}

// The wizard analog of crudTextFieldWidgets — every field across the given screen's steps that
// renders as a `TextFormField` in screen.ts's wizardFieldInput at all (String/int/double/Money,
// bypass-eligible, AND DateTime, readOnly/no bypass). Shared with test.ts's
// generateWizardFocusTest so it can assert the exact TextFormField count on a step without
// re-deriving wizardFieldInput's own field-type-to-widget mapping.
export function wizardTextFieldWidgets(screen: ScreenModel, entity: EntityModel | undefined): Field[] {
  if (!entity) return [];
  return wizardStepFields(screen, entity).filter((f) => TEXT_KEYBOARD_TYPES.has(f.type));
}

// UIX Slice C: deterministic field-role inference — the single source of truth every layout
// generator (screen.ts today; crud_form.ts/future widgets later) consults instead of re-deriving
// its own "what kind of field is this" heuristic. Rejects a client-side FieldPresentation schema
// (see design/flutter-app-builder/UIX_ENHANCEMENTS.md) in favor of inferring from field names +
// semanticType — 0% LLM, no new IR config surface, same input always yields the same role.
export type FieldRole = "title" | "description" | "identifier" | "date" | "status" | "priority" | "choice" | "money" | "relation" | "plain";

const TITLE_FIELD_NAMES = ["title", "name", "merchant", "label", "subject"];
const DESCRIPTION_FIELD_NAMES = ["description", "notes", "details"];

export interface FieldRoleContext {
  identityField?: string; // this entity's own identity field name (usually "id")
  entityNames?: string[]; // every entity name known to the IR, for FK ("relation") detection
}

// Checked in a fixed priority order so a field only ever matches ONE role even when it could
// structurally satisfy more than one heuristic (e.g. an identity field named "title" is still
// "identifier" first — structural facts about the entity outrank name-based guesses).
export function fieldRole(field: Field, ctx: FieldRoleContext = {}): FieldRole {
  if (ctx.identityField && field.name === ctx.identityField) return "identifier";
  if (isMoneyField(field)) return "money";
  // V1.1: an explicit IR-authored hint always wins, checked before any name-list/value-shape
  // heuristic below — same "explicit beats inferred" posture as semanticType/secret.
  if (field.type === "enum" && field.role === "choice") return "choice";
  // LM6: "decision" is a common domain synonym for a status-shaped approve/reject/pending enum
  // (an Approval entity's own field, for instance) — only ledgerly currently uses this name, so
  // widening the match is byte-identical for every other sample.
  if (field.type === "enum" && (field.name === "status" || field.name === "decision")) return "status";
  if (field.type === "enum" && field.name === "priority") return "priority";
  // V1.1: value-shape fallback — kept OFF by default (see kids_quiz's fields, which all set the
  // explicit `role:"choice"` hint above instead). Deliberately NOT auto-promoting every other
  // multi-value enum here: hr_service's `LeaveRequest.leaveType` (enum LeaveType, 3 values) is a
  // real counter-example already in the committed fleet — a descriptive category, not a picker —
  // and an automatic "any enum with >=2 values that isn't status/priority/decision" rule would
  // silently flip its rendering (DropdownButton -> ChoiceChip) and break the "all existing apps
  // stay byte-identical" regression contract. The explicit hint above is the only mechanism v1.1
  // ships; a future value-shape heuristic would need a narrower signal than "just has >=2 values"
  // to stay safe (documented in kids_quiz's v1.1 findings, not implemented here).
  if (field.type === "DateTime") return "date";
  if (TITLE_FIELD_NAMES.includes(field.name)) return "title";
  if (field.type === "String" && DESCRIPTION_FIELD_NAMES.includes(field.name)) return "description";
  // A `<lowerEntityName>Id` field is a foreign key only when that entity actually exists in this
  // IR — a field that merely LOOKS like an FK (no matching entity) falls through to "plain"
  // instead of silently misrendering as a relation with nothing to link to.
  if (field.name.endsWith("Id") && field.name !== "id") {
    const target = capitalize(field.name.slice(0, -2));
    if (ctx.entityNames?.includes(target)) return "relation";
  }
  return "plain";
}

// L2 policy engine (generators/policy.ts) — single source of truth for "which rules are policy
// rules" and "which entities need a generated policy engine", shared by symbols.ts (import
// resolution), index.ts (file emission), crud_form.ts (verdict-panel wiring), and validate.ts
// (the [verdict] gate). A rule opts into the policy engine by declaring `severity`; decision-table
// rules (`rows`) are out of scope for this slice — they classify (e.g. promotionStatus), they
// don't gate submission, and mixing per-row severity is a separate, larger design (not needed by
// any current app-type sample) — see report for the full scoping rationale.
export function isPolicyRule(r: RuleModel): boolean {
  return !!r.severity && !r.rows;
}

export function hasPolicyRules(ir: FeatureModel): boolean {
  return (ir.businessRules ?? []).some(isPolicyRule);
}

export function policyRulesForEntity(ir: FeatureModel, entityName: string): RuleModel[] {
  return (ir.businessRules ?? []).filter((r) => r.entity === entityName && isPolicyRule(r));
}

// Every distinct entity with >=1 policy rule — the set of entities that get a generated
// evaluate<Entity>Policy() function (one file each, domain/policy/<entity>_policy.dart).
export function policyEntities(ir: FeatureModel): string[] {
  return Array.from(new Set((ir.businessRules ?? []).filter(isPolicyRule).map((r) => r.entity)));
}

// V1.2: the subset of `entity`'s policy rules a WIZARD's own final step can render a per-question
// score/verdict for — a policy rule whose (single, flat-form) condition targets a field this
// wizard screen actually collects across its steps (stepFields), e.g. a quiz answer. A policy
// rule over a field the wizard never collects (kids_quiz's RunCompleted, gated on `status`, which
// is deliberately NOT a wizard step field) is correctly excluded — it stays a CRUD-form-only
// verdict, never shown on the wizard result step. Ordered by the step the condition's field is
// first collected in, matching the order a player actually answers them (screen.ts's
// gamifiedResultBlock and state.ts's needsDraft/draft getter are the two consumers).
export function gamifiedWizardRules(ir: FeatureModel, screen: ScreenModel, entity: EntityModel): RuleModel[] {
  const steps: WizardStep[] = screen.steps ?? [];
  const stepIndexOf = (fieldName: string | undefined): number =>
    fieldName === undefined ? -1 : steps.findIndex((st) => stepFields(st).includes(fieldName));
  return policyRulesForEntity(ir, entity.name)
    .filter((r) => stepIndexOf(r.conditions[0]?.field) !== -1)
    .sort((a, b) => stepIndexOf(a.conditions[0]?.field) - stepIndexOf(b.conditions[0]?.field));
}

// MF4 split/allocation — a "split group" is inferred purely from naming convention, no new IR
// schema surface: a child entity Y (≠ parent X) carrying BOTH the existing FK convention
// (`camelize(X) + "Id"`, the exact field childLinks/childForeignKey already key off) AND a field
// literally named "percent" (type double) is the parent's split-line entity. This composes with
// the pre-existing parent→children capability instead of introducing a second, competing
// relationship concept — same reasoning L2 used for `severity` (additive; a parent with no
// matching child entity takes zero new code paths). One split group per parent (first match) —
// concurrent split groups on a single parent are out of scope for this iteration (documented
// gap, not silently merged).
export interface SplitGroup {
  parent: string;
  child: string;
  fkField: string;
  categoryField?: string;
}

export function splitGroupFor(parentName: string, ir: FeatureModel): SplitGroup | undefined {
  const me = camelize(parentName);
  for (const e of ir.entities ?? []) {
    if (e.name === parentName) continue;
    const fk = e.fields.find((f) => f.name === `${me}Id`);
    if (!fk) continue;
    const percent = e.fields.find((f) => f.name === "percent" && f.type === "double");
    if (!percent) continue;
    const identityField = e.identity?.field ?? "id";
    const category = e.fields.find((f) => f.type === "String" && f.name !== fk.name && f.name !== identityField);
    return { parent: parentName, child: e.name, fkField: fk.name, categoryField: category?.name };
  }
  return undefined;
}

export function hasSplitGroups(ir: FeatureModel): boolean {
  return (ir.entities ?? []).some((e) => !!splitGroupFor(e.name, ir));
}

export function splitParentEntities(ir: FeatureModel): string[] {
  return (ir.entities ?? []).filter((e) => splitGroupFor(e.name, ir)).map((e) => e.name);
}

// MF3: whether the app opts into the attachment + OCR port capability — the single source of
// truth index.ts/symbols.ts/test.ts/validate.ts all share for "does this app ship
// core/attachment.dart" (mirrors hasMoneyFields/hasPolicyRules/hasSplitGroups/hasAuth above).
export function hasAttachments(ir: FeatureModel): boolean {
  return ir.attributes?.attachments === true;
}

// MF5: budget/quota — the declared attribute (types.ts's BudgetModel doc comment explains why
// this is explicit IR, not inference like MF4's split). `hasBudget` only reflects DECLARATION
// (used by validate.ts's [budget] gate to know whether to check at all); every generator gates
// emission on `resolveBudget` succeeding instead, so a malformed declaration (missing entity, or a
// field pointer that isn't Money-typed) emits nothing rather than half-broken code — the
// validator then reports the mismatch loudly, same defensive posture as splitGroupFor/
// splitCheck.
export function hasBudget(ir: FeatureModel): boolean {
  return !!ir.attributes?.budget;
}

// L4: l10n/RTL — whether the app opts into locale-aware AppStrings + MaterialApp locale wiring.
// Single source of truth every generator (infra.ts's AppStrings shape, project.ts's MaterialApp
// wiring, screen.ts/crud_form.ts's string call sites, the [l10n] gate) shares, mirroring
// hasBudget/hasAttachments above.
export function hasLocale(ir: FeatureModel): boolean {
  return !!ir.attributes?.locale;
}

export function localeOf(ir: FeatureModel): "en" | "ar" | "both" | "enArFr" | undefined {
  return ir.attributes?.locale;
}

// MF6: offline outbox — app-level (like budget/locale), not per-entity: every repo's
// create/update/delete write-ahead-enqueues regardless of which entity. Single source of truth
// shared by repository_impl.ts's hooks, index.ts's core-file gate, and the [outbox] validate.ts gate.
export function hasOutbox(ir: FeatureModel): boolean {
  return !!ir.attributes?.outbox;
}

export function budgetOf(ir: FeatureModel): BudgetModel | undefined {
  return ir.attributes?.budget;
}

// MF5: the budget entity's own descriptive label field (e.g. "category"/"country"/"team"), used
// as BudgetLine.scope — reuses the same "first non-identity String field" fallback screen.ts's
// pickTitle() applies elsewhere, so a budget entity needs no extra IR config beyond naming its own
// label field normally. Falls back to the identity field for the pathological case of an entity
// with no String field at all (still deterministic, never throws).
export function budgetScopeField(entity: EntityModel): Field | undefined {
  const identityField = entity.identity?.field ?? "id";
  return (
    entity.fields.find((f) => f.type === "String" && f.name !== identityField) ??
    entity.fields.find((f) => f.name === identityField)
  );
}

export interface ResolvedBudget {
  model: BudgetModel;
  entity: EntityModel;
  limitField: Field;
  committedField: Field;
  actualField: Field;
  scopeField?: Field;
}

// Resolves attributes.budget against the actual entity list — undefined (never a throw) when the
// entity is missing or any of the three field pointers doesn't resolve to an ACTUAL Money field,
// so a bad declaration fails validate.ts's [budget] gate loudly instead of crashing generation.
export function resolveBudget(ir: FeatureModel): ResolvedBudget | undefined {
  const model = budgetOf(ir);
  if (!model) return undefined;
  const entity = (ir.entities ?? []).find((e) => e.name === model.entity);
  if (!entity) return undefined;
  const limitField = entity.fields.find((f) => f.name === model.limitField && isMoneyField(f));
  const committedField = entity.fields.find((f) => f.name === model.committedField && isMoneyField(f));
  const actualField = entity.fields.find((f) => f.name === model.actualField && isMoneyField(f));
  if (!limitField || !committedField || !actualField) return undefined;
  return { model, entity, limitField, committedField, actualField, scopeField: budgetScopeField(entity) };
}

// L3: audit log — a per-entity opt-in (`EntityModel.audited`), not an app-wide `attributes.audit`
// toggle (types.ts's doc comment explains why: a real audit trail is selective by design — Ledgerly
// wants ExpenseClaim/Approval mutations logged, not User; auditing every entity indiscriminately
// would drown the compliance-relevant signal in noise). Mirrors hasMoneyFields/hasSplitGroups above:
// a single source of truth every generator (index.ts's core-file gate, repository_impl.ts's
// recordMutation hook, route.ts's /audit-log route, validate.ts's [audit] gate) shares.
export function auditedEntities(ir: FeatureModel): EntityModel[] {
  return (ir.entities ?? []).filter((e) => e.audited === true);
}

export function hasAudit(ir: FeatureModel): boolean {
  return auditedEntities(ir).length > 0;
}

export function isAudited(ir: FeatureModel, entityName: string): boolean {
  return auditedEntities(ir).some((e) => e.name === entityName);
}

// L3: export — the fields a CSV/JSON export ever includes: every scalar field EXCEPT `secret:
// true` ones (types.ts's doc comment) and non-scalar `reference`/`List` fields (there is no
// single-cell CSV representation for those, and JSON export stays a flat row shape to match CSV
// 1:1 rather than silently branching into a richer nested shape for one format only).
export function exportableFields(entity: EntityModel): Field[] {
  return entity.fields.filter((f) => !f.secret && f.type !== "reference" && f.type !== "List");
}

export interface ResolvedExport {
  screen: ScreenModel;
  entity: EntityModel;
  exportedField: Field;
}

// Resolves a `export:`-declared list screen against the entity it shows — undefined (never a
// throw) when the entity doesn't actually declare the `bool` field named `exported` the
// immutability rule needs somewhere to stamp, so a malformed declaration fails validate.ts's
// [export] gate loudly instead of the export button silently having nowhere to write the flag.
// Mirrors resolveBudget's defensive-resolution posture exactly.
export function resolveExport(ir: FeatureModel, screen: ScreenModel): ResolvedExport | undefined {
  if (!screen.export) return undefined;
  const entity = (ir.entities ?? []).find((e) => e.name === screen.entity);
  if (!entity) return undefined;
  const exportedField = entity.fields.find((f) => f.name === "exported" && f.type === "bool");
  if (!exportedField) return undefined;
  return { screen, entity, exportedField };
}

// Every screen that DECLARES `export:` (used by validate.ts's [export] gate, which must flag a
// declared-but-unresolved export separately from "no export declared at all").
export function declaredExportScreens(ir: FeatureModel): ScreenModel[] {
  return (ir.screens ?? []).filter((s) => !!s.export);
}

// Every screen whose `export:` actually resolves (used to gate core/export.dart emission and the
// UI's export-button wiring — same "emit nothing on a malformed declaration" posture as budget).
export function resolvedExportScreens(ir: FeatureModel): ResolvedExport[] {
  return declaredExportScreens(ir)
    .map((s) => resolveExport(ir, s))
    .filter((r): r is ResolvedExport => !!r);
}

export function hasExport(ir: FeatureModel): boolean {
  return resolvedExportScreens(ir).length > 0;
}

// Whether an entity is import-locked-after-export — i.e. some resolved export screen shows it, so
// its repository impl must refuse to mutate a row once `exported == true` (repository_impl.ts) and
// its generated form must disable Save on an already-exported record (crud_form.ts). An entity can
// be export-locked without being audited, and vice versa — orthogonal L3 capabilities composed on
// the same entity in the common case (a compliance record usually wants both), never coupled.
export function exportLockedEntity(ir: FeatureModel, entityName: string): ResolvedExport | undefined {
  return resolvedExportScreens(ir).find((r) => r.entity.name === entityName);
}

// The split child's own generated list-state name (if it declares one via `states`) — used to
// (a) provide its Cubit app-wide (project.ts's generateMain/generateMultiMain, since the split
// child deliberately has no `screens` entry and would otherwise never appear in the app's own
// distinctStates set) and (b) resolve the Cubit/State import in crud_form.ts/screen.ts.
export function splitStateNames(ir: FeatureModel): string[] {
  const names: string[] = [];
  for (const parent of splitParentEntities(ir)) {
    const group = splitGroupFor(parent, ir);
    const st = group ? (ir.states ?? []).find((s) => s.entity === group.child) : undefined;
    if (st) names.push(st.name);
  }
  return names;
}

// MF2 auth/tenant helpers — the single source of truth for "is this app auth-scoped / which
// accounts / which entities are tenant-scoped", shared by every generator that emits auth code
// (auth.ts, route.ts, repository_impl.ts, crud_form.ts, test.ts, symbols.ts, index.ts, and the
// validate.ts [tenant] gate) so none of them ever re-derives a competing heuristic.

export function hasAuth(ir: FeatureModel): boolean {
  return !!ir.attributes?.auth;
}

export function authOf(ir: FeatureModel): AuthModel | undefined {
  return ir.attributes?.auth;
}

export function authRoles(ir: FeatureModel): string[] {
  return authOf(ir)?.roles ?? [];
}

// Deterministic demo accounts for the generated login screen + generated tests: explicit IR
// `personas` win verbatim; otherwise one persona is derived per role with stable names/actor ids
// and a tenantCycled from a fixed pool, so a 2+-role app demos cross-tenant isolation instead of
// every account sharing one tenant. Same IR always yields the same accounts (0% LLM).
const TENANT_POOL = ["acme", "globex"];
const DEFAULT_PERSONA_NAMES: Record<string, string> = {
  employee: "Sara Ahmed",
  manager: "Khalid Aziz",
  finance: "Rana Yousef",
  "hr-admin": "Omar Khalid",
};
export function authPersonas(ir: FeatureModel): PersonaModel[] {
  const auth = authOf(ir);
  if (!auth) return [];
  const declared = auth.personas ?? [];
  if (declared.length) return declared;
  return auth.roles.map((r, i) => ({
    name: DEFAULT_PERSONA_NAMES[r] ?? `Demo ${capitalize(r)}`,
    role: r,
    actorId: `user-${i + 1}`,
    tenantId: TENANT_POOL[i % TENANT_POOL.length] ?? "acme",
  }));
}

// The distinct tenant ids the demo accounts use — the set every tenant-scoped app seeds its demo
// rows across (repository_impl.ts cycles these so each tenant "owns" some rows).
export function authTenantIds(ir: FeatureModel): string[] {
  return Array.from(new Set(authPersonas(ir).map((p) => p.tenantId)));
}

// Tenant scoping marker: an entity carrying a field literally named `tenantId` is the boundary of
// a tenant — every one of its repository's CRUD operations must be isolated to the signed-in
// session's tenant (see repository_impl.ts's _inScope/_stampTenant). This is the structural marker
// the validate.ts [tenant] gate asserts ON THE GENERATED CODE (a repo that lost its scoping while
// the IR still claims a tenantId field fails validation — same philosophy as money/datepicker).
export function hasTenantScoping(ir: FeatureModel, entityName?: string): boolean {
  const entities = entityName
    ? (ir.entities ?? []).filter((e) => e.name === entityName)
    : (ir.entities ?? []);
  return entities.some((e) => (e.fields ?? []).some((f) => f.name === "tenantId"));
}

// All entities in the IR that are tenant-scoped (carry tenantId) — used by validate.ts's [tenant]
// gate and (optionally) by generators that need to know the scoped set.
export function tenantScopedEntities(ir: FeatureModel): EntityModel[] {
  return (ir.entities ?? []).filter((e) => (e.fields ?? []).some((f) => f.name === "tenantId"));
}

// MF2 auth-aware generated test bootstrap: the app-boot regression tests (flow/crud/focus/back/
// policy/split) pump the whole ReplicaApp through the guard-protected router, which boots to the
// login screen when unauthenticated — so auth apps must sign in as a persona FIRST. This returns
// the exact `Session.instance.signIn(...)` statement for the FIRST persona (the role whose home
// area the evidence samples shape to cover those tests' routes), or "" for non-auth apps.
export function authBootstrapStatement(ir: FeatureModel, indent: string): string {
  const p = authPersonas(ir)[0];
  if (!p) return "";
  return `${indent}Session.instance.signIn(role: '${p.role}', actorId: '${p.actorId}', tenantId: '${p.tenantId}', displayName: '${p.name}');\n`;
}

// The set of entity names the FIRST persona may reach (its home entity + any allow entities) —
// the "reachable area" the per-test generators filter their targets against so a test never
// navigates to a route the signed-in role is deliberately denied (denial IS asserted by
// auth_test, not by the boot-tests). Returns an empty set for non-auth apps, which every caller
// treats as "unrestricted" so no-auth output stays byte-identical.
export function firstPersonaReachableEntities(ir: FeatureModel): Set<string> {
  const auth = authOf(ir);
  if (!auth) return new Set<string>();
  const first = authPersonas(ir)[0]?.role;
  if (!first || !auth.home?.[first]) return new Set<string>();
  const out = new Set<string>([auth.home[first]]);
  for (const e of auth.allow?.[first] ?? []) out.add(e);
  return out;
}

// Whether a given test-target entity is inside the first persona's reachable area. Non-auth apps
// (or an auth app with no resolvable first persona) are always reachable — backward compatible.
export function isTargetReachable(ir: FeatureModel, entityName: string): boolean {
  const reach = firstPersonaReachableEntities(ir);
  return reach.size === 0 || reach.has(entityName);
}

// The first entity with a `tenantId` field that also has a declared repository — the target the
// generated auth_test uses for its tenant-scope case (read/list filter + create stamp).
export function firstScopedRepoEntity(ir: FeatureModel): { entity: EntityModel; repo: RepositoryModel } | undefined {
  for (const e of tenantScopedEntities(ir)) {
    const repo = findRepoForEntity(ir.repositories, e.name);
    if (repo) return { entity: e, repo };
  }
  return undefined;
}

// S1 (§3.1): `attributes.platform` is a GENERATION TARGET, not an application capability — it is
// read only by the composition root (index.ts, for dispatch) and validate.ts (for the [platform]
// gate), never by a generator that shapes runtime app behavior. `ir` is `any` (not `FeatureModel`)
// because the composition root reads this before the single-/multi-feature IR shape is resolved
// (`generateApp`'s parameter is `FeatureModel | AppModel`, and this must read the raw union
// uniformly — mirrors flattenedIr's `any` in validate.ts for the same reason). Absent = "flutter",
// matching hasLocale/hasOutbox's `?? default` shape above.
export function targetOf(ir: any): GenerationTarget {
  return ir?.attributes?.platform ?? "flutter";
}

export function isSwiftUI(ir: any): boolean {
  return targetOf(ir) === "swiftui";
}
