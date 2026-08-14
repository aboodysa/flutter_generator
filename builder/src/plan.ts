import { FeatureModel } from "./types";

/**
 * Generation Plan — a first-class serialized artifact (DESIGN §6.1).
 * `IR → GenerationPlan → DependencyGraph → Generators → Output`.
 * One entry per generated artifact: {artifact, generator, strategy, dependsOn, mode, class}.
 * This is the unit of --dry-run, explainability, caching, and audit.
 */

export type GenClass = "structural" | "pattern" | "semantic" | "novel";
export type GenMode = "deterministic" | "semantic";

export interface PlanEntry {
  artifact: string; // e.g. "entity:Transaction", "state:TransactionList", "core:router"
  generator: string; // e.g. "EntityGenerator"
  schema: string; // e.g. "entity"
  layer: string; // e.g. "domain/entities"
  file: string; // output path relative to outDir
  strategy: string; // e.g. "default" | "enum-status" | "sealed-events" | "none"
  dependsOn: string[]; // artifact ids this entry depends on (structural deps)
  mode: GenMode;
  class: GenClass;
}

export interface GenerationPlan {
  schemaVersion: string;
  generatorVersion: string;
  artifactCount: number;
  entries: PlanEntry[];
  scoring?: unknown; // §5.2 app-level pattern-selection decision
}

/** Map an IR collection key to its artifact-id tag (e.g. "entities" → "entity"). */
const TAG_BY_KEY: Record<string, string> = {
  enums: "enum",
  valueObjects: "value_object",
  queries: "query",
  wrappers: "wrapper",
  entities: "entity",
  repositories: "repository",
  useCases: "usecase",
  datasources: "datasource",
  repositoryImpls: "repository_impl",
  states: "state",
  screens: "screen",
  stateMachines: "state_machine",
  forms: "form",
  businessRules: "rule",
};

export function tagForIrKey(irKey: string): string {
  const tag = TAG_BY_KEY[irKey];
  if (!tag) throw new Error(`[plan] unknown IR key '${irKey}'`);
  return tag;
}

/** Structural dependencies (DESIGN §12.1), read off explicit IR reference fields. */
export function dependsOnFor(kind: string, item: any): string[] {
  switch (kind) {
    case "useCases":
      return item.repository ? [`repository:${item.repository}`] : [];
    case "repositoryImpls": {
      const d: string[] = [];
      if (item.contract) d.push(`repository:${item.contract}`);
      if (item.datasource) d.push(`datasource:${item.datasource}`);
      return d;
    }
    case "states":
      return item.entity ? [`entity:${item.entity}`] : [];
    case "screens": {
      const d: string[] = [];
      if (item.entity) d.push(`entity:${item.entity}`);
      if (item.state) d.push(`state:${item.state}`);
      return d;
    }
    case "stateMachines":
      return item.entity ? [`entity:${item.entity}`] : [];
    case "businessRules":
      return item.entity ? [`entity:${item.entity}`] : [];
    default:
      return [];
  }
}

/** Sanity check: every dependsOn reference should resolve to an artifact we emit. */
export function validatePlanReferences(plan: GenerationPlan): string[] {
  const ids = new Set(plan.entries.map((e) => e.artifact));
  const issues: string[] = [];
  for (const e of plan.entries) {
    for (const dep of e.dependsOn) {
      if (!ids.has(dep)) issues.push(`[plan] ${e.artifact} depends on unresolved '${dep}'`);
    }
  }
  return issues;
}
