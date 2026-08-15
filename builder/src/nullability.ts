// Nullability + default-value helpers (SRP slice of the former dart.ts).

import { Field } from "./types";

export function hasDefault(f: Field): boolean {
  return f.default !== undefined || f.type === "List";
}

export function nullable(f: Field): boolean {
  return !!(f.nullable || (!f.required && !hasDefault(f)));
}

export function defaultValue(f: Field): string {
  if (f.default !== undefined) {
    if (typeof f.default === "string") return `'${f.default}'`;
    return String(f.default);
  }
  if (f.type === "List") return "const []";
  return "";
}
