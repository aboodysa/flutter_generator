import { PersistenceKind } from "./types";

/**
 * Persistence backend registry (DESIGN §10 — plugin = strategy + template family; §5.2-F2).
 * The single source of truth for which persistence backends exist, their package dependency,
 * and their template id. Mirrors provider.ts's shape for the state-management axis (OCP: adding
 * a backend = one entry here + its generator branch, not a rewrite of callers).
 *
 * Backends (research/persistence_benchmark.json, locked in research/PERSISTENCE_ARCH.md):
 * drift (SQL, schema-driven, web via sqlite3.wasm) and hive_ce (NoSQL, web IndexedDB, typed
 * adapters). sqflite/objectbox/isar/shared_preferences deferred — see the benchmark for why.
 */

export interface PersistenceDef {
  id: PersistenceKind;
  package: string | null; // pubspec dependency (null = no dependency, "none")
  version: string;
  backend: string; // human-readable backend name ("drift" | "hive_ce" | "none")
  templateMarker: string; // template= marker emitted by the generated schema/adapter file
}

export const PERSISTENCE: Record<PersistenceKind, PersistenceDef> = {
  none: { id: "none", package: null, version: "", backend: "none", templateMarker: "persistence_none.v1" },
  sql: { id: "sql", package: "drift", version: "^2.34.3", backend: "drift", templateMarker: "persistence_sql_drift.v1" },
  nosql: { id: "nosql", package: "hive_ce", version: "^2.19.2", backend: "hive_ce", templateMarker: "persistence_nosql_hive.v1" },
};

export function persistenceFor(id: PersistenceKind): PersistenceDef {
  return PERSISTENCE[id];
}
