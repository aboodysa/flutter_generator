// Deterministic sample/demo data synthesis + entity lookup (SRP slice of the former dart.ts).

import { EntityModel, Field, ValueObjectModel } from "./types";
import { isMoneyField } from "./operations";

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
  // P7-L1: Money is a two-field VO (minorUnits + currency), never a raw double — checked before
  // the generic single-primitive semanticType/VO fallback below.
  if (isMoneyField(f)) return `Money(minorUnits: 0, currency: '${f.currency}')`;
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
// distinguishable values across ALL fields (not just required ones) so a display field
// that happens to be optional — e.g. a nullable `merchant` title — is still populated
// instead of silently staying null and rendering as "Untitled".
export function variantSampleArgs(entity: EntityModel, enums: any[], valueObjects: ValueObjectModel[], index: number): string {
  if (index === 0) return sampleArgs(entity, enums, valueObjects);
  const literal = (f: Field): string => {
    // Money's underlying `type` is "double" — must be checked before the `f.type === "double"`
    // branch below, else a money field would get a raw double literal instead of a Money(...).
    if (isMoneyField(f)) return `Money(minorUnits: ${index * 10000 + 5000}, currency: '${f.currency}')`;
    if (f.type === "String") return `'Sample item ${index}'`;
    if (f.type === "double") return `${index * 100 + 50}.0`;
    if (f.type === "int") return String(index);
    if (f.type === "DateTime") return "DateTime(2025)";
    return sampleArgFor(f, enums, valueObjects);
  };
  return entity.fields.map((f) => `${f.name}: ${literal(f)}`).join(", ");
}
