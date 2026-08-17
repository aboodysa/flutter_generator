import { StateModel, FeatureModel, PersistenceKind } from "./types";
import { listEntityName, hasFullCrud } from "./operations";

/**
 * Deterministic pattern-selection scoring function (DESIGN §5.2).
 * Chooses the generation strategy from explicit IR attributes — never by the LLM.
 *
 * selection = score(collectionCardinality, filterAxes, refreshCadence, density,
 *                   responsiveness, offlinePolicy, permissionScope, stateComplexity)
 *
 * v3.4: below a complexity floor the function resolves to the `none`/vanilla
 * strategy rather than over-generating state/DI/routing for minimal screens.
 */

export type StateStrategy = "none" | "enum-status" | "sealed-events";

export interface ScoringInputs {
  collectionCardinality: number;
  filterAxes: number;
  refreshCadence: number;
  density: number;
  responsiveness: number;
  offlinePolicy: number;
  permissionScope: number;
  stateComplexity: number;
  hasRelationships: boolean; // §5.2-F2: any entity has a `reference`-typed field
  documentShaped: boolean; // any entity has a `List`-typed (nested) field
  fullCrudSurface: boolean; // some repository implements create+update+delete for its list entity
}

export interface ScoringDecision {
  inputs: ScoringInputs;
  complexity: number;
  stateManagement: "none" | "bloc" | "riverpod";
  di: "none" | "get_it" | "provider_scope";
  routing: "none" | "go_router";
  persistence: PersistenceKind;
  reason: string;
}

// Ordinal maps for the declarable attributes (higher = more machinery justified).
const REFRESH: Record<string, number> = { static: 0, occasional: 1, frequent: 2, realtime: 3 };
const DENSITY: Record<string, number> = { comfortable: 0, compact: 1 };
const RESPONSIVENESS: Record<string, number> = { mobile: 0, responsive: 1 };
const OFFLINE: Record<string, number> = { none: 0, cache: 1, "offline-first": 2 };
const PERMISSION: Record<string, number> = { none: 0, basic: 1, sensitive: 2 };

// Below this normalized complexity, over-generating state/DI/routing is unjustified → none.
const NONE_FLOOR = 3;

export function computeInputs(ir: FeatureModel): ScoringInputs {
  const a = ir.attributes ?? {};
  const filterAxes = (ir.queries ?? []).reduce((n, q) => n + (q.fields?.length ?? 0), 0);
  const ord = (m: Record<string, number>, k: string, d: number) => m[k] ?? d;

  let stateComplexity = 0;
  for (const s of ir.states ?? []) stateComplexity += (s.statuses ?? []).length + (s.extraFields?.length ?? 0);
  for (const sm of ir.stateMachines ?? []) {
    stateComplexity += (sm.states?.length ?? 0) + (sm.transitions?.length ?? 0);
    stateComplexity += (sm.transitions ?? []).filter((t) => t.guard).length; // guards add transition surface
  }

  const hasRelationships = ir.entities.some((e) => e.fields.some((f) => f.type === "reference"));
  const documentShaped = ir.entities.some((e) => e.fields.some((f) => f.type === "List"));
  const fullCrudSurface = (ir.repositories ?? []).some((r) => {
    const entityName = listEntityName(r);
    return !!entityName && hasFullCrud(r, entityName);
  });

  return {
    collectionCardinality: ir.entities.length,
    filterAxes,
    refreshCadence: ord(REFRESH, a.refreshCadence ?? "occasional", 1),
    density: ord(DENSITY, a.density ?? "comfortable", 0),
    responsiveness: ord(RESPONSIVENESS, a.responsiveness ?? "mobile", 0),
    offlinePolicy: ord(OFFLINE, a.offlinePolicy ?? "none", 0),
    permissionScope: ord(PERMISSION, a.permissionScope ?? "none", 0),
    stateComplexity,
    hasRelationships,
    documentShaped,
    fullCrudSurface,
  };
}

// Persistence selection (§5.2-F2, SQL-biased — locked, see design/flutter-app-builder/research/
// PERSISTENCE_ARCH.md). Explicit `attributes.persistence` always wins; otherwise score SQL-affinity
// vs NoSQL-affinity from the same declarative inputs used for state-mgmt scoring.
function scorePersistence(ir: FeatureModel, i: ScoringInputs): { persistence: PersistenceKind; reason: string } {
  const override = ir.attributes?.persistence;
  if (override) return { persistence: override, reason: `explicit override persistence=${override}` };

  const sqlScore =
    (i.offlinePolicy === 2 ? 3 : i.offlinePolicy === 1 ? 1 : 0) + // offline-first(3) | cache(1)
    (i.hasRelationships ? 2 : 0) +
    (i.filterAxes >= 3 ? 1 : 0) + // queryAxes >= 3
    (i.fullCrudSurface ? 1 : 0);
  const nosqlScore =
    (i.offlinePolicy === 1 ? 2 : 0) + // cache(2)
    (i.documentShaped ? 2 : 0);

  if (sqlScore >= 3) return { persistence: "sql", reason: `sqlScore ${sqlScore} >= 3 (drift)` };
  if (nosqlScore >= 2) return { persistence: "nosql", reason: `nosqlScore ${nosqlScore} >= 2 (hive_ce)` };
  return { persistence: "none", reason: `sqlScore ${sqlScore} nosqlScore ${nosqlScore} — in-memory` };
}

export function scoreApp(ir: FeatureModel): ScoringDecision {
  const i = computeInputs(ir);
  const { persistence, reason: persistenceReason } = scorePersistence(ir, i);

  // Explicit provider override (enterprise: human-pinned selection) wins over scoring.
  const override = ir.attributes?.stateManagement;
  if (override) {
    const stateManagement = override;
    if (override === "none") {
      return {
        inputs: i, complexity: 0, stateManagement, di: "none", routing: "none", persistence,
        reason: `explicit override stateManagement=none; ${persistenceReason}`,
      };
    }
    return {
      inputs: i, complexity: i.stateComplexity || 1, stateManagement,
      di: override === "riverpod" ? "provider_scope" : "get_it",
      routing: "go_router",
      persistence,
      reason: `explicit override stateManagement=${override} (coupled-pair: ${override} × ${override === "riverpod" ? "provider_scope" : "get_it"}); ${persistenceReason}`,
    };
  }

  const complexity =
    i.collectionCardinality +
    i.filterAxes +
    2 * i.refreshCadence +
    i.density +
    i.responsiveness +
    2 * i.offlinePolicy +
    2 * i.permissionScope +
    i.stateComplexity;

  if (complexity < NONE_FLOOR) {
    return {
      inputs: i,
      complexity,
      stateManagement: "none",
      di: "none",
      routing: "none",
      persistence,
      reason: `complexity ${complexity} < ${NONE_FLOOR} — vanilla (none) strategy; ${persistenceReason}`,
    };
  }

  return {
    inputs: i,
    complexity,
    stateManagement: "bloc",
    di: "get_it",
    routing: "go_router",
    persistence,
    reason: `complexity ${complexity} — bloc (enterprise default) + get_it + go_router; ${persistenceReason}`,
  };
}

/**
 * Per-state strategy (granular). Decided purely from declared IR semantics — never from a
 * frozen threshold or a synthetic status list (owner directive: no hardcoded magic numbers).
 *
 * §5.2-F3: a state strategy lifts to `sealed-events` ONLY when the IR itself declares a state
 * machine whose state vocabulary matches this state's declared statuses AND that carries a real
 * event/transition surface (events + transitions). Without such a declared machine the
 * generator emits the enum-status template, so claiming sealed-events would be a lie
 * (caught by the [strategy-fidelity] gate — see SPIKE M4 / RCA).
 */
export function scoreStateStrategy(s: StateModel, ir: FeatureModel): StateStrategy {
  const statuses = s.statuses ?? [];
  const vocab = (sm: { states?: string[] }) => new Set(sm.states ?? []);
  const matches = (sm: { states?: string[] }) =>
    statuses.length > 0 && statuses.every((st) => vocab(sm).has(st));
  const hasSurface = (sm: { events?: string[]; transitions?: unknown[] }) =>
    (sm.events?.length ?? 0) > 0 && (sm.transitions?.length ?? 0) > 0;

  for (const sm of ir.stateMachines ?? []) {
    if (matches(sm) && hasSurface(sm)) return "sealed-events";
  }
  return "enum-status";
}
