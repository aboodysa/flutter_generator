import { FeatureModel } from "./types";

/**
 * Field-level write-ACL (DESIGN §9.3) — deterministic trust boundary for Phase 3.
 * Enforces that human-only fields (implementation: novel, classification) are only ever set
 * with an attested human actor — never by an agent credential.
 */

const HUMAN_ONLY_FIELDS = ["implementation", "classification"];

export function enforceWriteAcl(ir: any): string[] {
  const violations: string[] = [];

  const check = (label: string, element: any) => {
    if (!element || typeof element !== "object") return;
    for (const f of HUMAN_ONLY_FIELDS) {
      if (element[f] !== undefined && element.actor !== "human:attested") {
        violations.push(`[acl] ${label}: field '${f}' requires actor=human:attested (got ${element.actor ?? "none"})`);
      }
    }
  };

  for (const [kind, items] of Object.entries(ir)) {
    if (Array.isArray(items)) {
      items.forEach((e: any, i: number) => check(`${kind}[${i}]`, e));
    }
  }
  return violations;
}
