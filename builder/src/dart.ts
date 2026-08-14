import { EntityModel, Field, ValueObjectModel, DartTypeMap } from "./types";

// Shared deterministic Dart helpers used by every generator (DRY: one source of truth).
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

export function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

// PascalCase/camelCase → snake_case file name (correct for multi-word names).
export function fileName(typeName: string): string {
  return `${typeName.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase()}.dart`;
}

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

// VO base-type lookup for semantic-type parsing (e.g. Money -> double).
export function voBaseType(voName: string, valueObjects: ValueObjectModel[]): string {
  const vo = valueObjects.find((v) => v.name === voName);
  return vo ? vo.baseType : "double";
}

export function entityByName(name: string, entities: EntityModel[]): EntityModel {
  const e = entities.find((x) => x.name === name);
  if (!e) throw new Error(`[symbol] unknown entity '${name}'`);
  return e;
}

// Deterministic sample constructor args for an entity's required fields (used by generated tests + demo data).
export function sampleArgFor(f: Field, enums: any[], valueObjects: ValueObjectModel[]): string {
  if (f.semanticType) {
    const vo = valueObjects.find((v) => v.name === f.semanticType);
    return `${f.semanticType}(${vo?.baseType === "String" ? "'x'" : "0"})`;
  }
  switch (f.type) {
    case "String": return "'x'";
    case "int": return "0";
    case "double": return "0.0";
    case "bool": return "false";
    case "DateTime": return "DateTime(2024)";
    case "enum": return `${f.of ?? "Object"}.values.first`;
    case "List": return "const []";
    case "reference": return "null";
    default: return "null";
  }
}

export function sampleArgs(entity: EntityModel, enums: any[], valueObjects: ValueObjectModel[]): string {
  return entity.fields.filter((f) => f.required).map((f) => `${f.name}: ${sampleArgFor(f, enums, valueObjects)}`).join(", ");
}

// Deterministic demo rows for a list state: row 0 is the neutral sample, rows 1+ get
// distinguishable values in the first String + first numeric field so the rendered list
// looks real instead of N identical rows.
export function variantSampleArgs(entity: EntityModel, enums: any[], valueObjects: ValueObjectModel[], index: number): string {
  if (index === 0) return sampleArgs(entity, enums, valueObjects);
  const literal = (f: Field): string => {
    if (f.type === "String") return `'Sample item ${index}'`;
    if (f.type === "double") return `${index * 100 + 50}.0`;
    if (f.type === "int") return String(index);
    return sampleArgFor(f, enums, valueObjects);
  };
  return entity.fields.filter((f) => f.required).map((f) => `${f.name}: ${literal(f)}`).join(", ");
}

// Dart built-ins never generate an import.
const BUILTIN = new Set([
  "Future", "Stream", "List", "Map", "Set", "String", "int", "double", "bool",
  "dynamic", "Object", "void", "DateTime", "num", "Duration",
]);

export interface GenContext {
  pkg: string; // package name (e.g. "rasheed_replica_expense")
  symbols: Map<string, string>; // typeName → package path
  ir?: any; // full IR, for cross-reference lookups (operation param naming, etc.)
}

// Scan Dart type strings for generated-type references and emit import lines.
// With a GenContext, emits package imports resolved via the symbol table (feature-first layout).
export function importsFromTypes(types: string[], ctx?: GenContext): string[] {
  const refs = new Set<string>();
  for (const s of types) {
    for (const m of s.matchAll(/\b([A-Z][A-Za-z0-9]+)\b/g)) {
      const t = m[1];
      if (t && !BUILTIN.has(t)) refs.add(t);
    }
  }
  return Array.from(refs)
    .sort()
    .map((t) => {
      const p = ctx?.symbols.get(t);
      return p ? `import 'package:${ctx!.pkg}/${p}';` : `import '${fileName(t)}';`;
    });
}
