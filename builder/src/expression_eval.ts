import { Field, RuleExpression, RuleOperator, ValueExpression } from "./types";
import { isMoneyField } from "./operations";

/**
 * BREL reference evaluator (design/flutter-app-builder/research/BREL_TYPES_IMPL_BRIEF_CLAUDE.md
 * Task 3) — computes a RuleExpression against a plain field-value record, mirroring
 * expression.ts's compileExpression Dart semantics exactly (same operator/fn semantics,
 * short-circuit and/or). Pure, no I/O; proves the Dart compiler and this evaluator agree
 * (golden tests) — never reached by the generator itself.
 *
 * Record conventions (mirror the Dart runtime shape compileExpression's output assumes):
 * - Money fields: the record holds the integer MINOR-UNITS value directly (compileExpression
 *   emits `e.field.minorUnits`) — e.g. `{ amount: 1999 }` for $19.99. A Money literal in the
 *   expression (e.g. `{ value: 19.99 }`) is converted the same way `compileExpression`'s
 *   `literalExpr` does (`Math.round(value * 100)`) before comparing.
 * - DateTime fields: the record holds a JS `Date`.
 * - enum fields: the record holds the member name as a plain string (e.g. `"happy"`), matching
 *   `EnumType.value`'s runtime identity.
 */

export type FieldRecord = Record<string, unknown>;

interface FnEvalSpec {
  kind: "value" | "predicate";
  eval: (args: unknown[], now: Date) => unknown;
}

function daysBetween(from: Date, to: Date): number {
  // Mirrors Dart's `Duration.inDays`, which truncates toward zero.
  return Math.trunc((to.getTime() - from.getTime()) / 86400000);
}

const FN_REGISTRY: Record<string, FnEvalSpec> = {
  daysSince: { kind: "value", eval: ([d], now) => daysBetween(d as Date, now) },
  daysUntil: { kind: "value", eval: ([d], now) => daysBetween(now, d as Date) },
  isBefore: { kind: "predicate", eval: ([a, b]) => (a as Date).getTime() < (b as Date).getTime() },
  isAfter: { kind: "predicate", eval: ([a, b]) => (a as Date).getTime() > (b as Date).getTime() },
  isBetween: {
    kind: "predicate",
    eval: ([a, b, c]) => (a as Date).getTime() > (b as Date).getTime() && (a as Date).getTime() < (c as Date).getTime(),
  },
};

function fnSpec(name: string): FnEvalSpec {
  const spec = FN_REGISTRY[name];
  if (!spec) throw new Error(`[expression_eval] unknown fn '${name}' — not in the BREL fn registry (daysSince/daysUntil/isBefore/isAfter/isBetween)`);
  return spec;
}

function fieldDefOf(v: ValueExpression, fields: Field[]): Field | undefined {
  return "field" in v ? fields.find((f) => f.name === v.field) : undefined;
}

function evalLiteral(value: string | number | boolean | (string | number)[], counterpart: Field | undefined): unknown {
  if (Array.isArray(value)) return value.map((v) => evalLiteral(v, undefined));
  if (counterpart && isMoneyField(counterpart)) return Math.round(parseFloat(String(value)) * 100);
  return value; // enum literal stays its member-name string; String/int/double/bool pass through
}

function evalValue(v: ValueExpression, record: FieldRecord, now: Date, counterpart?: Field): unknown {
  if ("field" in v) return record[v.field];
  if ("fn" in v) {
    const spec = fnSpec(v.fn);
    const args = v.args.map((a) => evalValue(a, record, now));
    return spec.eval(args, now);
  }
  return evalLiteral(v.value, counterpart);
}

function applyOperator(left: unknown, op: RuleOperator, right: unknown, now: Date): boolean {
  switch (op) {
    case ">=": return (left as number | string) >= (right as number | string);
    case "<=": return (left as number | string) <= (right as number | string);
    case ">": return (left as number | string) > (right as number | string);
    case "<": return (left as number | string) < (right as number | string);
    case "==":
      return left instanceof Date && right instanceof Date ? left.getTime() === right.getTime() : left === right;
    case "!=":
      return left instanceof Date && right instanceof Date ? left.getTime() !== right.getTime() : left !== right;
    case "contains":
      return Array.isArray(left) ? left.includes(right) : String(left).includes(String(right));
    case "daysSince>": return daysBetween(left as Date, now) > (right as number);
    case "daysSince<": return daysBetween(left as Date, now) < (right as number);
    case "startsWith": return String(left).startsWith(String(right));
    case "endsWith": return String(left).endsWith(String(right));
    case "matches": return new RegExp(String(right)).test(String(left));
    case "in": return Array.isArray(right) && right.includes(left);
    case "notIn": return !(Array.isArray(right) && right.includes(left));
    case "isNull": return left === null || left === undefined;
    case "isNotNull": return !(left === null || left === undefined);
    case "isEmpty": return (left as string | unknown[]).length === 0;
    case "isNotEmpty": return (left as string | unknown[]).length !== 0;
  }
}

function evalComparison(c: { left: ValueExpression; op: RuleOperator; right: ValueExpression }, record: FieldRecord, fields: Field[], now: Date): boolean {
  const leftFieldDef = fieldDefOf(c.left, fields);
  const rightFieldDef = fieldDefOf(c.right, fields);
  const left = evalValue(c.left, record, now, rightFieldDef);
  const right = evalValue(c.right, record, now, leftFieldDef);
  return applyOperator(left, c.op, right, now);
}

/**
 * RuleExpression -> boolean, evaluated against `record`. `now` defaults to the real clock but
 * should be pinned in tests (daysSince/daysUntil/daysSince>/daysSince< all read it) so golden
 * results stay deterministic.
 */
export function evaluateExpression(node: RuleExpression, record: FieldRecord, fields: Field[], now: Date = new Date()): boolean {
  if ("and" in node) return node.and.every((n) => evaluateExpression(n, record, fields, now));
  if ("or" in node) return node.or.some((n) => evaluateExpression(n, record, fields, now));
  if ("not" in node) return !evaluateExpression(node.not, record, fields, now);
  if ("left" in node) return evalComparison(node, record, fields, now);
  const spec = fnSpec(node.fn);
  if (spec.kind !== "predicate") {
    throw new Error(`[expression_eval] fn '${node.fn}' is value-kind — it must appear inside a Comparison's left/right, not as a bare expression node`);
  }
  const args = node.args.map((a) => evalValue(a, record, now));
  return Boolean(spec.eval(args, now));
}
