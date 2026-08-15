// Nullability + default-value helpers (SRP slice of the former dart.ts).

import { Field } from "./types";
import { isMoneyField } from "./operations";

export function hasDefault(f: Field): boolean {
  return f.default !== undefined || f.type === "List";
}

export function nullable(f: Field): boolean {
  return !!(f.nullable || (!f.required && !hasDefault(f)));
}

export function defaultValue(f: Field): string {
  if (f.default !== undefined) {
    // P7-L1: an IR default on a money field is major units (same convention as rule.ts/oracle
    // literals) — never a bare double literal.
    if (isMoneyField(f)) return `Money(minorUnits: ${Math.round(Number(f.default) * 100)}, currency: '${f.currency}')`;
    if (typeof f.default === "string") return `'${f.default}'`;
    return String(f.default);
  }
  if (f.type === "List") return "const []";
  return "";
}
