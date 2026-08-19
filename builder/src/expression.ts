import { Field, RuleExpression, RuleOperator, ValueExpression } from "./types";
import { isMoneyField } from "./operations";

/**
 * BREL additive slice (design/flutter-app-builder/research/BREL_DECISION.md,
 * BREL_CHATGPT_ADDENDUM.md) — normalization + Dart compilation for the optional `expression`
 * tree on a RuleModel. Pure: no I/O, no LLM. Only reached when a rule sets `expression`;
 * existing `conditions[]`/`rows[]` rules never touch this module (generators/rule.ts's
 * conditionExpr, the flat-form compiler, is untouched — this is a parallel, independent path).
 */

// -------------------- function registry --------------------
// value-kind: returns a value, usable inside a Comparison's left/right.
// predicate-kind: returns a bool directly, usable as a bare RuleExpression leaf.
type FnKind = "value" | "predicate";
interface FnSpec {
  kind: FnKind;
  arity: number;
  dart: (args: string[]) => string;
}

const FN_REGISTRY: Record<string, FnSpec> = {
  daysSince: { kind: "value", arity: 1, dart: ([d]) => `DateTime.now().difference(${d}).inDays` },
  daysUntil: { kind: "value", arity: 1, dart: ([d]) => `${d}.difference(DateTime.now()).inDays` },
  isBefore: { kind: "predicate", arity: 2, dart: ([a, b]) => `${a}.isBefore(${b})` },
  isAfter: { kind: "predicate", arity: 2, dart: ([a, b]) => `${a}.isAfter(${b})` },
  isBetween: { kind: "predicate", arity: 3, dart: ([a, b, c]) => `(${a}.isAfter(${b}) && ${a}.isBefore(${c}))` },
};

function fnSpec(name: string): FnSpec {
  const spec = FN_REGISTRY[name];
  if (!spec) throw new Error(`[expression] unknown fn '${name}' — not in the BREL fn registry (daysSince/daysUntil/isBefore/isAfter/isBetween)`);
  return spec;
}

// -------------------- normalization (flat input -> canonical nested) --------------------
// Accepts, on a ValueExpression position: {field}, {value}, {fn,args} (args normalized recursively).
export function normalizeValueExpression(v: any): ValueExpression {
  if (v === null || typeof v !== "object") {
    throw new Error(`[expression] invalid value expression: ${JSON.stringify(v)}`);
  }
  if ("field" in v) return { field: String(v.field) };
  if ("fn" in v) return { fn: String(v.fn), args: (v.args ?? []).map(normalizeValueExpression) };
  if ("value" in v) return { value: v.value };
  throw new Error(`[expression] value expression missing field/value/fn: ${JSON.stringify(v)}`);
}

// Accepts, on a RuleExpression position:
//   {and:[...]} / {or:[...]} / {not:...}                         — logical combinators (recurse)
//   {left,op,right}                                               — already-canonical Comparison
//   {fn,args,op,value}                                            — flat fn-comparison (normalize)
//   {fn,args}                                                     — bare predicate call
//   {field,operator,value}                                        — flat RuleCondition shape (normalize)
export function normalizeExpression(input: any): RuleExpression {
  if (input === null || typeof input !== "object") {
    throw new Error(`[expression] invalid expression node: ${JSON.stringify(input)}`);
  }
  if (Array.isArray(input.and)) return { and: input.and.map(normalizeExpression) };
  if (Array.isArray(input.or)) return { or: input.or.map(normalizeExpression) };
  if ("not" in input) return { not: normalizeExpression(input.not) };

  if ("left" in input && "op" in input && "right" in input) {
    return {
      left: normalizeValueExpression(input.left),
      op: input.op as RuleOperator,
      right: normalizeValueExpression(input.right),
    };
  }
  // Flat fn-comparison: {fn, args, op, value} -> Comparison(left: fn-call, op, right: literal).
  if ("fn" in input && "op" in input) {
    return {
      left: { fn: String(input.fn), args: (input.args ?? []).map(normalizeValueExpression) },
      op: input.op as RuleOperator,
      right: { value: input.value },
    };
  }
  // Bare predicate fn call: {fn, args} with no comparison operator.
  if ("fn" in input) {
    return { fn: String(input.fn), args: (input.args ?? []).map(normalizeValueExpression) };
  }
  // Flat RuleCondition shape: {field, operator, value} -> Comparison(left: field, op, right: literal).
  if ("field" in input && "operator" in input) {
    return { left: { field: String(input.field) }, op: input.operator as RuleOperator, right: { value: input.value } };
  }
  throw new Error(`[expression] unrecognized expression shape: ${JSON.stringify(input)}`);
}

// -------------------- field collection (trust boundary + live-recompute triggers) --------------------
export function fieldsInExpression(e: RuleExpression): string[] {
  const out = new Set<string>();
  const walkValue = (v: ValueExpression) => {
    if ("field" in v) out.add(v.field);
    else if ("fn" in v) v.args.forEach(walkValue);
  };
  const walk = (node: RuleExpression) => {
    if ("and" in node) node.and.forEach(walk);
    else if ("or" in node) node.or.forEach(walk);
    else if ("not" in node) walk(node.not);
    else if ("left" in node) {
      walkValue(node.left);
      walkValue(node.right);
    } else if ("fn" in node) {
      node.args.forEach(walkValue);
    }
  };
  walk(e);
  return Array.from(out);
}

// -------------------- Dart compilation --------------------
function operatorExpr(left: string, op: RuleOperator, right: string): string {
  switch (op) {
    case "contains": return `${left}.contains(${right})`;
    case "daysSince>": return `DateTime.now().difference(${left}).inDays > ${right}`;
    case "daysSince<": return `DateTime.now().difference(${left}).inDays < ${right}`;
    case "startsWith": return `${left}.startsWith(${right})`;
    case "endsWith": return `${left}.endsWith(${right})`;
    case "matches": return `RegExp(${right}).hasMatch(${left})`;
    case "in": return `${right}.contains(${left})`;
    case "notIn": return `!${right}.contains(${left})`;
    case "isNull": return `${left} == null`;
    case "isNotNull": return `${left} != null`;
    case "isEmpty": return `${left}.isEmpty`;
    case "isNotEmpty": return `${left}.isNotEmpty`;
    default: return `${left} ${op} ${right}`; // >=, <=, >, <, ==, !=
  }
}

function fieldAccess(name: string, fields: Field[]): { expr: string; fieldDef?: Field } {
  const fieldDef = fields.find((f) => f.name === name);
  const money = fieldDef ? isMoneyField(fieldDef) : false;
  return { expr: money ? `e.${name}.minorUnits` : `e.${name}`, fieldDef };
}

function literalExpr(value: string | number | boolean | (string | number)[], counterpart: Field | undefined): string {
  if (Array.isArray(value)) {
    return `[${value.map((v) => literalExpr(v, undefined)).join(", ")}]`;
  }
  if (counterpart && isMoneyField(counterpart)) {
    return String(Math.round(parseFloat(String(value)) * 100));
  }
  if (counterpart && counterpart.type === "enum") {
    const enumType = counterpart.of || counterpart.name.charAt(0).toUpperCase() + counterpart.name.slice(1);
    return `${enumType}.${value}`;
  }
  if (typeof value === "string") return `'${value.replace(/'/g, "\\'")}'`;
  if (typeof value === "boolean") return value ? "true" : "false";
  return String(value);
}

// counterpart: the OTHER side's field def, if that side is a bare {field} ref — used to qualify
// this side's literal (money minorUnits / enum constant), mirroring generators/rule.ts's conditionExpr.
function compileValue(v: ValueExpression, fields: Field[], counterpart?: Field): string {
  if ("field" in v) return fieldAccess(v.field, fields).expr;
  if ("fn" in v) {
    const spec = fnSpec(v.fn);
    const args = v.args.map((a) => compileValue(a, fields));
    return spec.dart(args);
  }
  return literalExpr(v.value, counterpart);
}

function fieldDefOf(v: ValueExpression, fields: Field[]): Field | undefined {
  return "field" in v ? fields.find((f) => f.name === v.field) : undefined;
}

function compileComparison(c: { left: ValueExpression; op: RuleOperator; right: ValueExpression }, fields: Field[]): string {
  const leftFieldDef = fieldDefOf(c.left, fields);
  const rightFieldDef = fieldDefOf(c.right, fields);
  const left = compileValue(c.left, fields, rightFieldDef);
  const right = compileValue(c.right, fields, leftFieldDef);
  return operatorExpr(left, c.op, right);
}

/** RuleExpression -> a single Dart bool expression (no trailing `;`), for embedding in `return ...;`. */
export function compileExpression(node: RuleExpression, fields: Field[]): string {
  if ("and" in node) return `(${node.and.map((n) => compileExpression(n, fields)).join(" &&\n        ")})`;
  if ("or" in node) return `(${node.or.map((n) => compileExpression(n, fields)).join(" ||\n        ")})`;
  if ("not" in node) return `!(${compileExpression(node.not, fields)})`;
  if ("left" in node) return compileComparison(node, fields);
  const spec = fnSpec(node.fn);
  if (spec.kind !== "predicate") {
    throw new Error(`[expression] fn '${node.fn}' is value-kind — it must appear inside a Comparison's left/right, not as a bare expression node`);
  }
  const args = node.args.map((a) => compileValue(a, fields));
  return spec.dart(args);
}
