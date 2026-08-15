import { RuleModel, EntityModel, FeatureModel, Field } from "../types";
import { OracleFile } from "../oracle";
import { isMoneyField } from "../operations";

/**
 * RuleOracleTestGenerator — semantic, deterministic, 0% LLM at generation time
 * (the LLM's job, out of scope for this slice, is only to help author the
 * RuleModel/oracle cases; this generator compiles them into a Dart test).
 * Pure: (RuleModel, OracleFile, EntityModel, FeatureModel, pkg) → string. No I/O —
 * file access lives in ../oracle.ts (DIP).
 */

// Deterministic Dart literal for one required-field value from an oracle case's input
// (mirrors sampleArgs in ../dart.ts; missing/null falls back to the same neutral defaults).
function fieldLiteral(f: Field, value: any, feature: FeatureModel): string {
  // P7-L1: oracle case JSON expresses money in major units (e.g. 1500 = 1500.00) — the same
  // convention rule.ts's conditionExpr uses for RuleCondition literals — scaled ×100 into Money.
  if (isMoneyField(f)) {
    if (value === undefined || value === null) return `Money(minorUnits: 0, currency: '${f.currency}')`;
    return `Money(minorUnits: ${Math.round(Number(value) * 100)}, currency: '${f.currency}')`;
  }
  if (f.semanticType) {
    const vo = (feature.valueObjects ?? []).find((v) => v.name === f.semanticType);
    const base = vo?.baseType ?? "String";
    if (value === undefined || value === null) {
      return `${f.semanticType}(${base === "String" ? "''" : "0"})`;
    }
    return `${f.semanticType}(${base === "String" ? `'${String(value).replace(/'/g, "\\'")}'` : String(value)})`;
  }
  if (f.type === "reference") return "null";
  if (value === undefined || value === null) {
    switch (f.type) {
      case "String": return "''";
      case "int": return "0";
      case "double": return "0.0";
      case "bool": return "false";
      case "DateTime": return "DateTime(2024)";
      case "enum": return `${f.of ?? "Object"}.values.first`;
      case "List": return "const []";
      default: return "null";
    }
  }
  switch (f.type) {
    case "String": return `'${String(value).replace(/'/g, "\\'")}'`;
    case "int": return String(value);
    case "double": return Number.isInteger(value) ? `${value}.0` : String(value);
    case "bool": return value ? "true" : "false";
    case "DateTime": return `DateTime.parse('${value}')`;
    case "enum": return `${f.of ?? "Object"}.${value}`;
    case "List": return "const []";
    default: return "null";
  }
}

function expectedLiteral(expected: string | number | boolean): string {
  if (typeof expected === "boolean") return expected ? "true" : "false";
  if (typeof expected === "number") return String(expected);
  return `'${String(expected).replace(/'/g, "\\'")}'`;
}

export function generateOracleTest(
  rule: RuleModel,
  oracle: OracleFile,
  entity: EntityModel,
  feature: FeatureModel,
  pkg: string,
): string {
  const requiredFields = entity.fields.filter((f) => f.required);

  const cases = oracle.cases
    .map((c, i) => {
      const args = requiredFields.map((f) => `${f.name}: ${fieldLiteral(f, c.input[f.name], feature)}`).join(", ");
      const expected = expectedLiteral(c.expected);
      // Description is plain text (never the Dart literal) so a string outcome like 'expired'
      // doesn't nest an unescaped quote inside the outer single-quoted test description.
      const desc = typeof c.expected === "string" ? c.expected.replace(/'/g, "\\'") : String(c.expected);
      return `  test('case ${i + 1}: expected ${desc}', () {
    final e = ${entity.name}(${args});
    expect(${rule.name}().evaluate(e), equals(${expected}));
  });`;
    })
    .join("\n\n");

  return `// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + ${rule.name}.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/generated.dart';

void main() {
${cases}
}
`;
}
