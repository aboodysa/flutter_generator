import { StateModel, FeatureModel } from "./types";

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
}

export interface ScoringDecision {
  inputs: ScoringInputs;
  complexity: number;
  stateManagement: "none" | "bloc";
  di: "none" | "get_it";
  routing: "none" | "go_router";
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
// Above this state complexity, exhaustive matching pays for itself → sealed-events.
const SEALED_EVENTS_THRESHOLD = 8;

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

  return {
    collectionCardinality: ir.entities.length,
    filterAxes,
    refreshCadence: ord(REFRESH, a.refreshCadence ?? "occasional", 1),
    density: ord(DENSITY, a.density ?? "comfortable", 0),
    responsiveness: ord(RESPONSIVENESS, a.responsiveness ?? "mobile", 0),
    offlinePolicy: ord(OFFLINE, a.offlinePolicy ?? "none", 0),
    permissionScope: ord(PERMISSION, a.permissionScope ?? "none", 0),
    stateComplexity,
  };
}

export function scoreApp(ir: FeatureModel): ScoringDecision {
  const i = computeInputs(ir);
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
      reason: `complexity ${complexity} < ${NONE_FLOOR} — vanilla (none) strategy`,
    };
  }

  return {
    inputs: i,
    complexity,
    stateManagement: "bloc",
    di: "get_it",
    routing: "go_router",
    reason: `complexity ${complexity} — bloc + get_it + go_router`,
  };
}

/** Per-state strategy (granular) — chosen by the state's own transition surface. */
export function scoreStateStrategy(s: StateModel): StateStrategy {
  const statuses = s.statuses ?? ["initial", "loading", "success", "failure"];
  const extra = s.extraFields ?? [];
  const complexity = statuses.length + extra.length;

  if (statuses.length <= 0) return "none";
  if (complexity >= SEALED_EVENTS_THRESHOLD) return "sealed-events";
  return "enum-status";
}
