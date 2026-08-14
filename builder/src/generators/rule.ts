import { RuleModel, RuleCondition } from "../types";
import { GenContext } from "../dart";

/**
 * BusinessRuleGenerator — structural, deterministic, 0% LLM (Phase 3 deterministic core).
 * IR RuleModel (formal rule, §19) → a Dart evaluator. The LLM's job (Phase 3) is to produce the
 * RuleModel; this generator compiles it deterministically — never hand-written logic.
 */

/** Compile a single condition to a Dart expression over the subject `e`. */
function conditionExpr(c: RuleCondition): string {
  const f = `e.${c.field}`;
  switch (c.operator) {
    case "contains": return `${f}.contains(${c.value})`;
    case "daysSince>": return `DateTime.now().difference(${f}).inDays > ${c.value}`;
    case "daysSince<": return `DateTime.now().difference(${f}).inDays < ${c.value}`;
    default: return `${f} ${c.operator} ${c.value}`;
  }
}

export function generateRule(rule: RuleModel, ctx?: GenContext): string {
  const entityImport = ctx?.symbols.get(rule.entity)
    ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(rule.entity)}';`
    : `import '${rule.entity.toLowerCase()}.dart';`;

  const header = `// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: ${rule.name}
${entityImport}
`;

  // Decision-table form (§19): first matching row wins; `result` is the default outcome.
  const rows = rule.rows ?? [];
  if (rows.length) {
    const rowCode = rows
      .map((r, i) => {
        const conds = (r.conditions ?? []).map(conditionExpr).join(" &&\n        ");
        return `    if (${conds}) return '${r.outcome}'; // row ${i + 1}`;
      })
      .join("\n");
    return `${header}
class ${rule.name} {
  String? evaluate(${rule.entity} e) {
${rowCode}
    return ${rule.result ? `'${rule.result}'` : "null"};
  }
}
`;
  }

  // Flat form: all conditions must hold (AND) — boolean outcome.
  const conditions = rule.conditions
    .map(conditionExpr)
    .join(" &&\n        ");

  return `${header}
class ${rule.name} {
  bool evaluate(${rule.entity} e) {
    return ${conditions};
  }
}
`;
}
