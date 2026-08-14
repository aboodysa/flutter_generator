import * as fs from "fs";

/**
 * Reverse extraction (DESIGN §11.2, Phase 4) — deterministic part.
 * Parse an existing Dart entity file's `final <type> <name>;` fields into an IR EntityModel.
 * Produces an IR fragment (semantic reconstruction), not a full round-trip.
 */
interface Field { name: string; type: string; }

function parseFields(dart: string): Field[] {
  const fields: Field[] = [];
  const re = /^\s*final\s+([\w<>,.?\s]+?)\s+(\w+)\s*;/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(dart)) !== null) {
    fields.push({ name: m[2] ?? "", type: (m[1] ?? "").replace(/\s+/g, "") });
  }
  return fields;
}

function dartToIrType(t: string): { type: string; of?: string; nullable: boolean } {
  const nullable = t.endsWith("?");
  const base = t.replace(/\?$/, "");
  if (base.startsWith("List<")) return { type: "List", of: base.slice(5, -1).replace(/Entity$/, ""), nullable };
  if (base === "String") return { type: "String", nullable };
  if (base === "int") return { type: "int", nullable };
  if (base === "double") return { type: "double", nullable };
  if (base === "bool") return { type: "bool", nullable };
  if (base === "DateTime") return { type: "DateTime", nullable };
  return { type: "reference", of: base.replace(/Entity$/, ""), nullable };
}

export function extractEntity(dart: string, name: string): any {
  const fields = parseFields(dart);
  const identity = fields.find((f) => f.name === "id");
  return {
    name,
    identity: identity ? { field: "id" } : undefined,
    equality: "identity",
    immutability: true,
    fields: fields.map((f) => {
      const t = dartToIrType(f.type);
      return { name: f.name, type: t.type, of: t.of, nullable: t.nullable, required: !t.nullable };
    }),
  };
}

export function main(): void {
  const file = process.argv[2];
  const name = process.argv[3] ?? "Entity";
  if (!file) { console.error("usage: extract.ts <dart-file> [EntityName]"); process.exit(1); }
  const dart = fs.readFileSync(file, "utf8");
  const entity = extractEntity(dart, name);
  console.log(JSON.stringify(entity, null, 2));
}

if (require.main === module) main();
