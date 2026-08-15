// Dart type-mapping — IR Field type → Dart type string (SRP slice of the former dart.ts).

import { Field, DartTypeMap } from "./types";
import { capitalize } from "./naming";

export const DART_TYPES: DartTypeMap = {
  String: "String",
  int: "int",
  double: "double",
  bool: "bool",
  DateTime: "DateTime",
  enum: "",
  List: "",
  reference: "",
};

export function fieldDartType(f: Field): string {
  if (f.semanticType) return f.semanticType;
  switch (f.type) {
    case "enum":
      return f.of || capitalize(f.name);
    case "List":
      return `List<${capitalize((f.of || "dynamic").trim())}>`;
    case "reference":
      return f.of || "Object";
    default:
      return DART_TYPES[f.type];
  }
}

export function referencedType(f: Field): string | null {
  if (f.semanticType) return f.semanticType;
  if (f.type === "enum") return f.of || capitalize(f.name);
  if (f.type === "reference") return f.of || null;
  if (f.type === "List") return f.of ? capitalize(f.of.trim()) : null;
  return null;
}
