// Repository-operation classification — shared, deterministic, depends only on types.ts and
// naming.ts (both dependency-free themselves). Single source of truth for "what CRUD kind is this
// operation" so scoring.ts (persistence selection) and repository_impl.ts (CRUD codegen) never
// drift on the same heuristic.
import { OperationModel, OperationKind, RepositoryModel, FeatureModel, ScreenModel, WizardStep, EntityModel, Field, RuleModel } from "./types";
import { capitalize } from "./naming";

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
export function firstCrudTextField(entity: EntityModel, identityField: string): Field | undefined {
  return crudEditableFields(entity, identityField).find((f) => CRUD_TEXT_FIELD_TYPES.has(f.type));
}

// Bug A / RCA-005 / keyboard-bypass follow-up: the field crud_form.ts wires a gesture-bound
// FocusNode.requestFocus() bypass onto — the first editable field that renders a REAL
// (non-readOnly) keyboard-invoking TextField, on BOTH create and edit routes. DateTime is
// excluded even though it's controller-backed: G2 made it `readOnly: true` (opens a date picker
// on tap), so it never needs a keyboard at all. Shared with test.ts's generated focus regression
// test so both agree on which field is expected to carry the bypass without drifting.
export function firstFocusBypassField(entity: EntityModel, identityField: string): Field | undefined {
  const CONTROLLER_TYPES = new Set(["String", "int", "double", "DateTime"]);
  return crudEditableFields(entity, identityField).find((f) => CONTROLLER_TYPES.has(f.type) && f.type !== "DateTime");
}

// UIX Slice C: deterministic field-role inference — the single source of truth every layout
// generator (screen.ts today; crud_form.ts/future widgets later) consults instead of re-deriving
// its own "what kind of field is this" heuristic. Rejects a client-side FieldPresentation schema
// (see design/flutter-app-builder/UIX_ENHANCEMENTS.md) in favor of inferring from field names +
// semanticType — 0% LLM, no new IR config surface, same input always yields the same role.
export type FieldRole = "title" | "description" | "identifier" | "date" | "status" | "priority" | "money" | "relation" | "plain";

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
  if (field.type === "enum" && field.name === "status") return "status";
  if (field.type === "enum" && field.name === "priority") return "priority";
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
