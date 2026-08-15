// Generation context — the per-run values every generator may need (SRP slice of the former
// dart.ts; named gen_context.ts, not context.ts, because context.ts already exists for the
// unrelated lockfile builder).
//
// ISP: most generators only need the package name + symbol table (PkgContext). Only generators
// that cross-reference the full IR (screen/state/usecase/repository_impl) or branch on the
// state-management provider need the wider GenContext. Generator signatures should declare the
// narrowest capability they actually use — TS structural typing lets index.ts keep constructing
// and passing one full GenContext everywhere without any caller-side change.
import { StateManagementProvider } from "./types";

export interface PkgContext {
  pkg: string; // package name (e.g. "rasheed_replica_expense")
  symbols: Map<string, string>; // typeName → package path
}

export interface GenContext extends PkgContext {
  ir?: any; // full IR, for cross-reference lookups (operation param naming, etc.)
  sm?: StateManagementProvider; // selected state-management provider (from the arch layer)
}
