import * as fs from "fs";
import * as path from "path";
import { FeatureModel } from "./types";

/**
 * Oracle corpus (DESIGN §9.4) — human example/expected-value pairs + invariants.
 * SRP: this module only locates/reads oracle files; it does no generation.
 * Stored as sibling <rule>.oracle.json files, not embedded in the IR, so the oracle
 * corpus stays independently reviewable/diffable from the structural spec.
 */

export interface OracleCase {
  input: Record<string, any>;
  expected: string | number | boolean;
}

export interface OracleFile {
  rule: string;
  entity: string;
  cases: OracleCase[];
  invariants?: string[];
}

/** Oracle files live in a `rules/` directory next to the IR file. */
export function oracleDirFor(irPath: string): string {
  return path.join(path.dirname(irPath), "rules");
}

/** Read `<ruleName>.oracle.json` from `oracleDir`; null if it doesn't exist. */
export function loadOracle(ruleName: string, oracleDir: string): OracleFile | null {
  const p = path.join(oracleDir, `${ruleName}.oracle.json`);
  if (!fs.existsSync(p)) return null;
  return JSON.parse(fs.readFileSync(p, "utf8")) as OracleFile;
}

/**
 * Oracle coverage over every declared business rule: rules with no oracle file are
 * `missing`; rules with an oracle file but zero cases are `empty`. Both mean the
 * rule's generated code is unverified — DESIGN's non-negotiable "never trust
 * deterministic code without an independent oracle" (§0).
 */
export function oracleCoverage(ir: FeatureModel, oracleDir: string): { missing: string[]; empty: string[] } {
  const missing: string[] = [];
  const empty: string[] = [];
  for (const rule of ir.businessRules ?? []) {
    const oracle = loadOracle(rule.name, oracleDir);
    if (!oracle) missing.push(rule.name);
    else if (!oracle.cases || oracle.cases.length === 0) empty.push(rule.name);
  }
  return { missing, empty };
}
