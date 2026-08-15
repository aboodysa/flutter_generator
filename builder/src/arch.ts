import { FeatureModel, StateManagementProvider } from "./types";
import { scoreApp, scoreStateStrategy, StateStrategy } from "./scoring";

/**
 * Architecture decision layer (DESIGN §5.2 + §10). The single source of truth for the
 * architecture a generated app uses — state management, DI, routing, and per-state strategy.
 * Generators consume an `ArchitectureDecision`; they do NOT re-derive or hardcode it.
 *
 * SRP: this module decides architecture. `scoring.ts` is the pure §5.2 scoring primitive.
 * The coupled-pair matrix (§10.2) is the guard: an unproven (stateManagement × DI) cell is
 * refused — selection can never silently emit an unsupported combination.
 */

export type DiStrategy = "none" | "get_it" | "provider_scope";

export interface ArchitectureDecision {
  stateManagement: StateManagementProvider;
  di: DiStrategy;
  routing: "none" | "go_router";
  perStateStrategy: Map<string, StateStrategy>;
  complexity: number;
  coupledPair: string; // "bloc × get_it"
  reason: string;
}

// Coupled-pair matrix (§10.2): the proven (stateManagement × DI) cells. Additive-only.
//
// `routing` (the third axis §10.2 also names) is deliberately NOT in this guard: unlike
// stateManagement × DI, routing is not an independent selection today — scoring.ts's scoreApp()
// always derives it 1:1 from stateManagement (`none` -> routing "none", anything else ->
// "go_router"; see scoring.ts). There is currently no code path that could produce an unproven
// (stateManagement × routing) combination, so guarding it here would be dead code. SOLID review
// #7: if routing ever becomes independently selectable, extend PROVEN_COUPLED_PAIRS to 3-tuples
// (or a second matrix) at that point — don't add it speculatively now.
const PROVEN_COUPLED_PAIRS: Set<string> = new Set([
  "none × none",
  "bloc × get_it",
  "riverpod × provider_scope",
]);

export function decideArchitecture(ir: FeatureModel): ArchitectureDecision {
  const app = scoreApp(ir);
  const perStateStrategy = new Map<string, StateStrategy>();
  for (const s of ir.states ?? []) perStateStrategy.set(s.name, scoreStateStrategy(s));

  const coupledPair = `${app.stateManagement} × ${app.di}`;
  if (!PROVEN_COUPLED_PAIRS.has(coupledPair)) {
    throw new Error(
      `[arch] unsupported coupled-pair '${coupledPair}' (stateManagement × DI). Proven cells: ${[...PROVEN_COUPLED_PAIRS].join(", ")}.`,
    );
  }

  return {
    stateManagement: app.stateManagement,
    di: app.di,
    routing: app.routing,
    perStateStrategy,
    complexity: app.complexity,
    coupledPair,
    reason: app.reason,
  };
}
