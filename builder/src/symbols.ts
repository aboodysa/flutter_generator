import { FeatureModel } from "./types";
import { fileName } from "./dart";
import { crudFormTargets, crudFormScreenName, hasMoneyFields } from "./operations";

// Symbol table + package naming — the single source of truth for cross-reference resolution (A6).
export function pkgName(feature: string): string {
  return `rasheed_replica_${feature}`.replace(/[^a-z0-9_]/g, "_");
}

/**
 * Build the symbol table: typeName → package path (features/<f>/<layer>/<file>.dart).
 * Every generator resolves cross-references through this, never by ad-hoc string matching.
 */
export function buildSymbols(ir: FeatureModel): Map<string, string> {
  const m = new Map<string, string>();
  const add = (name: string, layer: string, file: string) => m.set(name, `features/${ir.name}/${layer}/${file}`);

  for (const e of ir.enums ?? []) add(e.name, "domain/entities", fileName(e.name));
  for (const v of ir.valueObjects ?? []) add(v.name, "domain/entities", fileName(v.name));
  for (const q of ir.queries ?? []) add(q.name, "domain/entities", fileName(q.name));
  for (const w of ir.wrappers ?? []) add(w.name, "domain/entities", fileName(w.name));
  for (const e of ir.entities ?? []) {
    add(e.name, "domain/entities", fileName(e.name));
    add(`${e.name}Model`, "data/models", fileName(e.name).replace(/\.dart$/, "_model.dart"));
  }
  for (const r of ir.repositories ?? []) add(r.name, "domain/repositories", fileName(r.name));
  for (const u of ir.useCases ?? []) add(u.name, "domain/usecases", fileName(u.name));
  for (const d of ir.datasources ?? []) add(d.name, "data/datasources", fileName(d.name));
  for (const ri of ir.repositoryImpls ?? []) add(ri.name, "data/repositories", fileName(ri.name));
  for (const repo of ir.repositories ?? []) {
    if (!(ir.repositoryImpls ?? []).some((ri) => ri.contract === repo.name)) {
      add(`${repo.name}InMemoryImpl`, "data/repositories", fileName(`${repo.name}InMemoryImpl`));
    }
  }
  for (const s of ir.states ?? []) add(s.name, "presentation/state", fileName(s.name));
  for (const sc of ir.screens ?? []) add(sc.name, "presentation/screens", fileName(sc.name));
  for (const entity of crudFormTargets(ir).keys()) {
    const n = crudFormScreenName(entity);
    add(n, "presentation/screens", fileName(n));
  }
  for (const sm of ir.stateMachines ?? []) add(`${sm.name}StateMachine`, "domain/state_machines", fileName(`${sm.name}StateMachine`));
  for (const f of ir.forms ?? []) add(f.name, "presentation/forms", fileName(f.name));
  for (const r of ir.businessRules ?? []) add(r.name, "domain/rules", fileName(r.name));
  if ((ir.useCases ?? []).some((u) => u.paramType === "NoParams")) m.set("NoParams", "core/no_params.dart");
  if (hasMoneyFields(ir)) m.set("Money", "core/money.dart");
  return m;
}
