import { FeatureModel } from "./types";

/**
 * Incremental regeneration (DESIGN §13) — deterministic part of Phase 4.
 * Computes the affected-set of a change to one IR artifact via the dependency graph.
 * A change to entity X → everything that transitively depends on X.
 */

// dependency: artifactType/name → list of dependent [type, name] pairs.
interface Dep {
  type: string;
  name: string;
}

function deps(ir: FeatureModel): Map<string, Dep[]> {
  const d = new Map<string, Dep[]>();
  const add = (from: string, toType: string, toName: string) => {
    if (!d.has(from)) d.set(from, []);
    d.get(from)!.push({ type: toType, name: toName });
  };

  // entity → model
  for (const e of ir.entities ?? []) add(`entity:${e.name}`, "model", e.name);
  // entity → repository contracts that reference it
  for (const r of ir.repositories ?? []) {
    for (const op of r.operations) {
      const scan = (s: string) => { for (const m of s.matchAll(/\b([A-Z][A-Za-z0-9]+)\b/g)) { const t = m[1]; const e = ir.entities?.find((x) => x.name === t); if (e) add(`entity:${e.name}`, "repository", r.name); } };
      scan(op.returns); op.params.forEach((p) => scan(p.type));
    }
  }
  // repository → usecase, repository → impl
  for (const u of ir.useCases ?? []) add(`repository:${u.repository}`, "usecase", u.name);
  for (const ri of ir.repositoryImpls ?? []) add(`repository:${ri.contract}`, "repositoryImpl", ri.name);
  // datasource → impl
  for (const ri of ir.repositoryImpls ?? []) add(`datasource:${ri.datasource}`, "repositoryImpl", ri.name);
  // entity → state, entity → screen
  for (const s of ir.states ?? []) add(`entity:${s.entity}`, "state", s.name);
  for (const sc of ir.screens ?? []) add(`entity:${sc.entity}`, "screen", sc.name);
  // state → screen
  for (const sc of ir.screens ?? []) add(`state:${sc.state}`, "screen", sc.name);
  return d;
}

export function affected(ir: FeatureModel, changed: string): string[] {
  const d = deps(ir);
  const out = new Set<string>();
  const queue = [changed];
  while (queue.length) {
    const cur = queue.shift()!;
    for (const dep of d.get(cur) ?? []) {
      const key = `${dep.type}:${dep.name}`;
      if (!out.has(key)) { out.add(key); queue.push(key); }
    }
  }
  return Array.from(out);
}

// CLI: builder/src/regen.ts <ir> <changed>  (e.g. "entity:Transaction")
export function main(): void {
  const ir = JSON.parse(require("fs").readFileSync(process.argv[2] ?? "builder/samples/expense.semantic.ir.json", "utf8")) as FeatureModel;
  const changed = process.argv[3] ?? "entity:Transaction";
  const a = affected(ir, changed);
  console.log(`change: ${changed}`);
  console.log(`affected (${a.length}):`);
  a.forEach((x) => console.log(`  - ${x}`));
}

if (require.main === module) main();
