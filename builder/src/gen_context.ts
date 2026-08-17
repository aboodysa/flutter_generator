// Generation context — the per-run values every generator may need (SRP slice of the former
// dart.ts; named gen_context.ts, not context.ts, because context.ts already exists for the
// unrelated lockfile builder).
//
// ISP: most generators only need the package name + symbol table (PkgContext). Only generators
// that cross-reference the full IR (screen/state/usecase/repository_impl) or branch on the
// state-management provider need the wider GenContext. Generator signatures should declare the
// narrowest capability they actually use — TS structural typing lets index.ts keep constructing
// and passing one full GenContext everywhere without any caller-side change.
import { StateManagementProvider, StatePlacementSpec } from "./types";
import { SearchSpec, ScrollSpec, ActionSpec } from "./composition";

export interface PkgContext {
  pkg: string; // package name (e.g. "rasheed_replica_expense")
  symbols: Map<string, string>; // typeName → package path
}

export interface GenContext extends PkgContext {
  ir?: any; // full IR, for cross-reference lookups (operation param naming, etc.)
  sm?: StateManagementProvider; // selected state-management provider (from the arch layer)
  // P2 (contract §4): composition.ts's searchTargets(ir), computed once per generateApp run —
  // screen.ts looks itself up by `s.name` to render its own decided SearchSpec (or nothing).
  search?: Map<string, SearchSpec>;
  // P3 (contract §5): composition.ts's scrollTargets(ir), computed once per generateApp run —
  // screen.ts looks itself up by `s.name` to decide whether to emit the scroll-tint listener.
  scroll?: Map<string, ScrollSpec>;
  // P4 (contract §6): composition.ts's actionsTargets(ir), computed once per generateApp run —
  // screen.ts looks itself up by `s.name` to render its decided ActionSpec[] (or nothing). The
  // ONLY action decision — screen.ts never re-derives from crudTarget/audit/export.
  actions?: Map<string, ActionSpec[]>;
  // P5/D2 Slice 2: composition.ts's statePlacementTargets(ir), computed once per generateApp run —
  // screen.ts looks itself up by `s.name` to render its decided StatePlacementSpec's loading/error
  // branches (or nothing, for a wizard screen). The ONLY placement decision — screen.ts never
  // re-derives it from `state.status`.
  states?: Map<string, StatePlacementSpec>;
}
