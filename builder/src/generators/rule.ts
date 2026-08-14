import { RuleModel } from "../types";
import { GenContext } from "../dart";

/**
 * BusinessRuleGenerator — structural, deterministic, 0% LLM (Phase 3 deterministic core).
 * IR RuleModel (formal rule, §19) → a Dart evaluator. The LLM's job (Phase 3) is to produce the
 * RuleModel; this generator compiles it deterministically — never hand-written logic.
 */
export function generateRule(rule: RuleModel, ctx?: GenContext): string {
  const conditions = rule.conditions
    .map((c) => {
      if (c.operator === "contains") return `e.${c.field}.contains(${c.value})`;
      return `e.${c.field} ${c.operator} ${c.value}`;
    })
    .join(" &&\n        ");

  const entityImport = ctx?.symbols.get(rule.entity)
    ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(rule.entity)}';`
    : `import '${rule.entity.toLowerCase()}.dart';`;

  return `// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: ${rule.name}
${entityImport}

class ${rule.name} {
  bool evaluate(${rule.entity} e) {
    return ${conditions};
  }
}
`;
}
