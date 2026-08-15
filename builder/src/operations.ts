// Repository-operation classification — shared, deterministic, dependency-free (types.ts only).
// Single source of truth for "what CRUD kind is this operation" so scoring.ts (persistence
// selection) and repository_impl.ts (CRUD codegen) never drift on the same heuristic.
import { OperationModel, OperationKind, RepositoryModel, FeatureModel, ScreenModel, WizardStep } from "./types";

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
