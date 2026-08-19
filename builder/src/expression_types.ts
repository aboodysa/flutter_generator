import { EntityModel, EnumModel, Field, RuleExpression, RuleOperator, ValueExpression } from "./types";
import { isMoneyField } from "./operations";

/**
 * BREL semantic type system (design/flutter-app-builder/research/BREL_TYPES_IMPL_BRIEF_CLAUDE.md
 * Task 2) — resolves each field ref in a RuleExpression to its declared type and rejects
 * type-incompatible operator/fn/operand combinations BEFORE Dart generation ever sees the tree.
 * Pure, no I/O. The proven fn+operator surface (expression.ts's FN_REGISTRY / types.ts's
 * RuleOperator) is FROZEN for this slice — FN_TYPES below is a typed VIEW of that existing
 * registry, not a new one; this module adds typing, not surface.
 */

type TypeKind = "Money" | "DateTime" | "enum" | "bool" | "String" | "List" | "int" | "double" | "unknown";

interface TypeTag {
  kind: TypeKind;
  of?: string; // enum type name, only when kind === "enum"
}

const UNKNOWN: TypeTag = { kind: "unknown" };

function fieldTypeTag(f: Field): TypeTag {
  if (isMoneyField(f)) return { kind: "Money" };
  if (f.type === "enum") return { kind: "enum", of: f.of ?? f.name };
  if (f.type === "String" || f.type === "int" || f.type === "double" || f.type === "bool" || f.type === "DateTime" || f.type === "List") {
    return { kind: f.type };
  }
  return UNKNOWN; // "reference" — not typed by this system, permissive
}

// Typed view of expression.ts's FN_REGISTRY (kind matches exactly) plus arg/return types per the
// brief: "daysSince/daysUntil arg must be DateTime; isBefore/isAfter/isBetween args must be
// DateTime." daysSince/daysUntil return a day count (int); the predicate fns return bool.
const FN_TYPES: Record<string, { argTypes: TypeKind[]; returns: TypeKind; kind: "value" | "predicate" }> = {
  daysSince: { argTypes: ["DateTime"], returns: "int", kind: "value" },
  daysUntil: { argTypes: ["DateTime"], returns: "int", kind: "value" },
  isBefore: { argTypes: ["DateTime", "DateTime"], returns: "bool", kind: "predicate" },
  isAfter: { argTypes: ["DateTime", "DateTime"], returns: "bool", kind: "predicate" },
  isBetween: { argTypes: ["DateTime", "DateTime", "DateTime"], returns: "bool", kind: "predicate" },
};

// Field-type -> legal operator set (Task 2 typing rules table). isNull/isNotNull are legal on
// EVERY kind ("any field type (nullable or not) OK") and are checked separately, not repeated here.
const OPS_BY_KIND: Record<Exclude<TypeKind, "unknown">, Set<RuleOperator>> = {
  Money: new Set([">=", "<=", ">", "<"]),
  DateTime: new Set([">=", "<=", ">", "<", "==", "!="]),
  enum: new Set(["==", "!=", "in", "notIn"]),
  bool: new Set(["==", "!="]),
  String: new Set(["==", "!=", "contains", "startsWith", "endsWith", "matches", "in", "notIn"]),
  List: new Set(["isEmpty", "isNotEmpty", "in", "notIn"]),
  int: new Set([">=", "<=", ">", "<", "==", "!="]),
  double: new Set([">=", "<=", ">", "<", "==", "!="]),
};

const NULL_OPS = new Set<RuleOperator>(["isNull", "isNotNull"]);
const MEMBERSHIP_OPS = new Set<RuleOperator>(["in", "notIn"]);
// The generic pairwise operand-compatibility check (brief: "numeric vs numeric, DateTime vs
// DateTime, String vs String, enum vs enum constant, Money vs numeric literal") only makes sense
// for the symmetric equality/ordering operators, where both sides represent "the same kind of
// thing." contains/startsWith/endsWith/matches are asymmetric (a String/List haystack vs a
// String needle) and are already fully covered by the operator-legality check above — running the
// pairwise check on them too would just double-report the same Money-piped-through-a-string-op
// mistake as two overlapping violations. isNull/isNotNull/isEmpty/isNotEmpty ignore the right
// operand entirely (mirrors operatorExpr, which never reads it); in/notIn is handled separately
// (right is a collection, not a scalar).
const SYMMETRIC_COMPARE_OPS = new Set<RuleOperator>([">=", "<=", ">", "<", "==", "!="]);

function numericKind(k: TypeKind): boolean {
  return k === "Money" || k === "int" || k === "double";
}

function typesCompatible(a: TypeTag, b: TypeTag): boolean {
  if (a.kind === "unknown" || b.kind === "unknown") return true; // permissive on unresolvable operands
  if (numericKind(a.kind) || numericKind(b.kind)) return numericKind(a.kind) && numericKind(b.kind);
  if (a.kind === "DateTime" || b.kind === "DateTime") return a.kind === "DateTime" && b.kind === "DateTime";
  if (a.kind === "enum" || b.kind === "enum") return a.kind === "enum" && b.kind === "enum" && a.of === b.of;
  if (a.kind === "String" || b.kind === "String") return a.kind === "String" && b.kind === "String";
  if (a.kind === "bool" || b.kind === "bool") return a.kind === "bool" && b.kind === "bool";
  if (a.kind === "List" || b.kind === "List") return a.kind === "List" && b.kind === "List";
  return true;
}

function elementCompatible(leftTag: TypeTag, el: unknown): boolean {
  if (leftTag.kind === "unknown") return true;
  if (leftTag.kind === "enum" || leftTag.kind === "String") return typeof el === "string";
  if (numericKind(leftTag.kind)) return typeof el === "number";
  if (leftTag.kind === "bool") return typeof el === "boolean";
  return true;
}

/**
 * typeCheckExpression — resolves every field ref in `e` against `entity.fields` (and `enums` for
 * enum membership), returning a list of human-readable violations (empty = OK). Never throws: an
 * unresolvable field/fn is reported as a violation and treated as `unknown` (permissive) for the
 * rest of that subtree's checks, so one bad leaf doesn't cascade into unrelated false positives.
 */
export function typeCheckExpression(e: RuleExpression, entity: EntityModel, enums: EnumModel[]): string[] {
  const violations: string[] = [];
  const fields = entity.fields;

  function fieldTag(name: string): TypeTag {
    const f = fields.find((x) => x.name === name);
    if (!f) {
      violations.push(`field '${name}' is not declared on entity '${entity.name}'`);
      return UNKNOWN;
    }
    return fieldTypeTag(f);
  }

  // Non-violating lookahead — used only to find the OTHER side's field type as a `counterpart`
  // hint (money/enum literal disambiguation, mirrors expression.ts's compileValue counterpart
  // param). `fieldTag` (above) is the sole violation-emitting resolver for a field ref; calling it
  // twice for the same operand (once here, once in `resolveValue`) would double-report a missing
  // field.
  function peekFieldTag(name: string): TypeTag {
    const f = fields.find((x) => x.name === name);
    return f ? fieldTypeTag(f) : UNKNOWN;
  }

  function checkEnumLiteral(tag: TypeTag, value: unknown): void {
    if (tag.kind !== "enum" || typeof value !== "string") return;
    const en = enums.find((x) => x.name === tag.of);
    if (en && !en.values.includes(value)) {
      violations.push(`enum literal '${value}' is not a member of ${tag.of} (values: ${en.values.join(", ")})`);
    }
  }

  function checkFnArgs(fnName: string, args: ValueExpression[]): { returns: TypeKind; kind: "value" | "predicate" } | undefined {
    const spec = FN_TYPES[fnName];
    if (!spec) {
      violations.push(`unknown fn '${fnName}' — not in the BREL fn registry (daysSince/daysUntil/isBefore/isAfter/isBetween)`);
      return undefined;
    }
    args.forEach((a, i) => {
      const argTag = resolveValue(a);
      const expected = spec.argTypes[i] ?? spec.argTypes[spec.argTypes.length - 1];
      if (expected && argTag.kind !== "unknown" && argTag.kind !== expected) {
        const label = "field" in a ? ` (field '${a.field}')` : "fn" in a ? ` (fn '${a.fn}')` : "";
        violations.push(`fn '${fnName}' arg ${i + 1} expects ${expected}${label}, got ${argTag.kind}`);
      }
    });
    return spec;
  }

  function resolveValue(v: ValueExpression, counterpart?: TypeTag): TypeTag {
    if ("field" in v) return fieldTag(v.field);
    if ("fn" in v) {
      const spec = checkFnArgs(v.fn, v.args);
      return spec ? { kind: spec.returns } : UNKNOWN;
    }
    return literalTag(v.value, counterpart);
  }

  function literalTag(value: string | number | boolean | (string | number)[], counterpart?: TypeTag): TypeTag {
    if (Array.isArray(value)) return { kind: "List" };
    if (counterpart?.kind === "Money" && typeof value === "number") return { kind: "Money" };
    if (counterpart?.kind === "enum" && typeof value === "string") {
      checkEnumLiteral(counterpart, value);
      return { kind: "enum", of: counterpart.of };
    }
    if (typeof value === "string") return { kind: "String" };
    if (typeof value === "boolean") return { kind: "bool" };
    if (typeof value === "number") return { kind: Number.isInteger(value) ? "int" : "double" };
    return UNKNOWN;
  }

  function checkComparison(c: { left: ValueExpression; op: RuleOperator; right: ValueExpression }): void {
    // A predicate-kind fn (isBefore/isAfter/isBetween) may never sit inside a Comparison's
    // left/right — mirrors compileExpression's own runtime guard, caught here at IR time instead.
    for (const side of [c.left, c.right]) {
      if ("fn" in side) {
        const spec = FN_TYPES[side.fn];
        if (spec && spec.kind === "predicate") {
          violations.push(`fn '${side.fn}' is predicate-kind — must be a bare expression node, not a Comparison operand`);
        }
      }
    }

    const leftFieldTag = "field" in c.left ? peekFieldTag(c.left.field) : undefined;
    const rightFieldTag = "field" in c.right ? peekFieldTag(c.right.field) : undefined;
    const leftTag = resolveValue(c.left, rightFieldTag);
    const rightTag = resolveValue(c.right, leftFieldTag);

    // Operator legality — checked against whichever side actually carries a resolved type (a
    // field ref or a fn's return type); a bare literal-vs-literal comparison has no field/fn basis
    // to type-check against and is skipped (not reachable from any real IR shape today).
    const primaryTag = "field" in c.left || "fn" in c.left ? leftTag : "field" in c.right || "fn" in c.right ? rightTag : undefined;
    if (primaryTag && primaryTag.kind !== "unknown" && !NULL_OPS.has(c.op)) {
      const allowed = OPS_BY_KIND[primaryTag.kind];
      if (!allowed.has(c.op)) {
        const label = primaryTag.of ? `${primaryTag.kind}<${primaryTag.of}>` : primaryTag.kind;
        violations.push(`operator '${c.op}' is not valid for ${label}`);
      }
    }

    if (MEMBERSHIP_OPS.has(c.op)) {
      if ("value" in c.right && Array.isArray(c.right.value)) {
        for (const el of c.right.value) {
          checkEnumLiteral(leftTag, el);
          if (!elementCompatible(leftTag, el)) {
            violations.push(`'${c.op}' list element ${JSON.stringify(el)} is incompatible with left operand type ${leftTag.kind}`);
          }
        }
      }
    } else if (SYMMETRIC_COMPARE_OPS.has(c.op)) {
      if (!typesCompatible(leftTag, rightTag)) {
        const l = leftTag.of ? `${leftTag.kind}<${leftTag.of}>` : leftTag.kind;
        const r = rightTag.of ? `${rightTag.kind}<${rightTag.of}>` : rightTag.kind;
        violations.push(`operand type mismatch: left is ${l}, right is ${r}`);
      }
    }
  }

  function walk(node: RuleExpression): void {
    if ("and" in node) return node.and.forEach(walk);
    if ("or" in node) return node.or.forEach(walk);
    if ("not" in node) return walk(node.not);
    if ("left" in node) return checkComparison(node);
    // Bare predicate fn call (isBefore/isAfter/isBetween used directly as a boolean leaf).
    const spec = FN_TYPES[node.fn];
    if (!spec) {
      violations.push(`unknown fn '${node.fn}' — not in the BREL fn registry (daysSince/daysUntil/isBefore/isAfter/isBetween)`);
      return;
    }
    if (spec.kind !== "predicate") {
      violations.push(`fn '${node.fn}' is value-kind — it must appear inside a Comparison's left/right, not as a bare expression node`);
      return;
    }
    checkFnArgs(node.fn, node.args);
  }

  walk(e);
  return violations;
}
