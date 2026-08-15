import { RuleModel, RuleCondition, Field } from "../types";
import { GenContext, importsFromTypes } from "../dart";
import { isMoneyField } from "../operations";

/**
 * BusinessRuleGenerator — structural, deterministic, 0% LLM (Phase 3 deterministic core).
 * IR RuleModel (formal rule, §19) → a Dart evaluator. The LLM's job (Phase 3) is to produce the
 * RuleModel; this generator compiles it deterministically — never hand-written logic.
 */

// P7-L1: a condition over a money field compares against `.minorUnits` (an int), never the Money
// object itself — Dart has no `Money >= 1000` overload for a bare numeric literal. The IR's
// condition `value` is expressed in major units (e.g. "1000" = 1000.00), matching how oracle
// cases/other IR literals already read; it's scaled ×100 to line up with minorUnits.
function conditionExpr(c: RuleCondition, fields: Field[]): string {
  const fieldDef = fields.find((x) => x.name === c.field);
  const money = fieldDef ? isMoneyField(fieldDef) : false;
  const f = money ? `e.${c.field}.minorUnits` : `e.${c.field}`;
  // Enum fields compare against the qualified enum constant (`Priority.high`), never the bare
  // IR value — the rule IR stores the member name, not a Dart expression.
  const enumType = fieldDef && fieldDef.type === "enum" ? (fieldDef.of || fieldDef.name.charAt(0).toUpperCase() + fieldDef.name.slice(1)) : undefined;
  const value = money ? String(Math.round(parseFloat(c.value) * 100)) : (enumType ? `${enumType}.${c.value}` : c.value);
  switch (c.operator) {
    case "contains": return `${f}.contains(${value})`;
    case "daysSince>": return `DateTime.now().difference(${f}).inDays > ${value}`;
    case "daysSince<": return `DateTime.now().difference(${f}).inDays < ${value}`;
    default: return `${f} ${c.operator} ${value}`;
  }
}

export function generateRule(rule: RuleModel, ctx?: GenContext): string {
  const entityFields = (ctx?.ir?.entities ?? []).find((e: any) => e.name === rule.entity)?.fields ?? [];
  const entityImport = ctx?.symbols.get(rule.entity)
    ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(rule.entity)}';`
    : `import '${rule.entity.toLowerCase()}.dart';`;

  // Enum fields actually referenced by conditions compare against their qualified constants
  // (`Priority.high`) — only those enum files need importing (all-field import yields unused_import
  // warnings for enums never compared).
  const condFieldNames = new Set((rule.rows ?? []).flatMap((r: any) => (r.conditions ?? []).map((c: any) => c.field)));
  (rule.conditions ?? []).forEach((c) => condFieldNames.add(c.field));
  const enumTypes = entityFields
    .filter((f: any) => f.type === "enum" && condFieldNames.has(f.name))
    .map((f: any) => f.of || f.name.charAt(0).toUpperCase() + f.name.slice(1));
  const enumImports = importsFromTypes(enumTypes, ctx)
    .map((i) => `import '${i.replace(/^import '|';$/g, "")}';`)
    .join("\n");

  const header = `// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: ${rule.name}
${entityImport}
${enumImports}
`;

  // Decision-table form (§19): first matching row wins; `result` is the default outcome.
  const rows = rule.rows ?? [];
  if (rows.length) {
    const rowCode = rows
      .map((r, i) => {
        const conds = (r.conditions ?? []).map((c) => conditionExpr(c, entityFields)).join(" &&\n        ");
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
    .map((c) => conditionExpr(c, entityFields))
    .join(" &&\n        ");

  return `${header}
class ${rule.name} {
  bool evaluate(${rule.entity} e) {
    return ${conditions};
  }
}
`;
}
