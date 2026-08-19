import { EntityModel, Field, ValueObjectModel } from "../types";
import { GenContext } from "../gen_context";
import { nullable, sampleArgFor, fileName } from "../dart";

/**
 * PersistenceGenerator — structural, deterministic, 0% LLM.
 * Emits the SQL (drift) table or NoSQL (hive_ce) adapter schema for an entity (§5.2-F2).
 *
 * Deliberately schema-only / codegen-free: a live `@DriftDatabase` needs drift_dev build_runner
 * output (a `.g.dart` part file) that this deterministic compiler doesn't invoke, so wiring one
 * here would emit code that fails `flutter analyze` until someone runs codegen. The hive_ce
 * adapter is hand-written for the same reason (no hive_ce_generator dependency). Both compile
 * standalone and are exercised by a unit test; the live repository impl stays in-memory
 * regardless of persistence selection (research/PERSISTENCE_ARCH.md: "in-memory fallback for
 * web/drift so CDP flow tests stay deterministic") — these files are the schema, not the runtime
 * path, until a future round wires a real `GeneratedDatabase`.
 */

const PRIMITIVE_TYPES = new Set(["String", "int", "double", "bool", "DateTime", "enum"]);

function driftColumn(f: Field): string | null {
  if (!PRIMITIVE_TYPES.has(f.type)) return null; // reference/List: relational modeling deferred
  const opt = nullable(f) ? ".nullable()" : "";
  switch (f.type) {
    case "String": return `  TextColumn get ${f.name} => text()${opt}();`;
    case "int": return `  IntColumn get ${f.name} => integer()${opt}();`;
    case "double": return `  RealColumn get ${f.name} => real()${opt}();`;
    case "bool": return `  BoolColumn get ${f.name} => boolean()${opt}();`;
    case "DateTime": return `  DateTimeColumn get ${f.name} => dateTime()${opt}();`;
    case "enum": return `  TextColumn get ${f.name} => text()${opt}(); // stores ${f.of ?? "enum"}.name`;
    default: return null;
  }
}

export function generateDriftTable(entity: EntityModel, ctx?: GenContext): string {
  const identity = entity.identity?.field;
  const columns = entity.fields.map(driftColumn).filter((c): c is string => !!c).join("\n");
  const skipped = entity.fields.filter((f) => !PRIMITIVE_TYPES.has(f.type)).map((f) => f.name);
  const skipNote = skipped.length
    ? ` Relational fields deferred (not yet FK/junction-modeled): ${skipped.join(", ")}.`
    : "";
  const entityImport = ctx?.symbols.get(entity.name)
    ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(entity.name)}';`
    : `import '${fileName(entity.name)}';`;

  return `// [generated] generator=PersistenceGenerator template=persistence_sql_drift.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Drift schema for ${entity.name} (SQL persistence, §5.2-F2). Schema-only — see file header
// docs in persistence.ts for why no @DriftDatabase/part-file is emitted here.${skipNote}
import 'package:drift/drift.dart';
${entityImport}

class ${entity.name}Table extends Table {
${columns}
${identity ? `\n  @override\n  Set<Column> get primaryKey => {${identity}};` : ""}
}
`;
}

function hiveReadExpr(f: Field): string {
  const key = `map['${f.name}']`;
  const opt = nullable(f);
  switch (f.type) {
    case "String": return opt ? `${key} as String?` : `${key} as String`;
    case "int": return opt ? `${key} as int?` : `${key} as int`;
    case "double": return opt ? `${key} as double?` : `${key} as double`;
    case "bool": return opt ? `${key} as bool?` : `${key} as bool`;
    case "DateTime": return opt ? `(${key} == null ? null : DateTime.parse(${key} as String))` : `DateTime.parse(${key} as String)`;
    case "enum": {
      const enumType = f.of ?? f.name;
      return opt ? `(${key} == null ? null : ${enumType}.values.byName(${key} as String))` : `${enumType}.values.byName(${key} as String)`;
    }
    default: return "null";
  }
}

function hiveWriteExpr(f: Field): string | null {
  const v = `obj.${f.name}`;
  const opt = nullable(f);
  switch (f.type) {
    case "String": case "int": case "double": case "bool": return v;
    case "DateTime": return opt ? `${v}?.toIso8601String()` : `${v}.toIso8601String()`;
    case "enum": return opt ? `${v}?.name` : `${v}.name`;
    default: return null; // reference/List: not persisted by this minimal adapter
  }
}

export function generateHiveAdapter(entity: EntityModel, enums: any[], valueObjects: ValueObjectModel[], typeId: number, ctx?: GenContext): string {
  const ctorArgs = entity.fields
    .map((f) => {
      const expr = PRIMITIVE_TYPES.has(f.type) ? hiveReadExpr(f) : sampleArgFor(f, enums, valueObjects);
      return `      ${f.name}: ${expr},`;
    })
    .join("\n");

  const writeEntries = entity.fields
    .map((f) => {
      const w = hiveWriteExpr(f);
      return w ? `      '${f.name}': ${w},` : null;
    })
    .filter((l): l is string => !!l)
    .join("\n");

  const skipped = entity.fields.filter((f) => !PRIMITIVE_TYPES.has(f.type)).map((f) => f.name);
  const skipNote = skipped.length
    ? ` Relational fields not persisted (placeholder on read): ${skipped.join(", ")}.`
    : "";
  const entityImport = ctx?.symbols.get(entity.name)
    ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(entity.name)}';`
    : `import '${fileName(entity.name)}';`;

  const enumTypes = [...new Set(entity.fields.filter((f) => f.type === "enum" && f.of).map((f) => f.of!))];
  const enumImports = enumTypes
    .map((et) => {
      const sym = ctx?.symbols.get(et);
      return sym
        ? `import 'package:${ctx!.pkg}/${sym}';`
        : `import '${fileName(et)}';`;
    })
    .join("\n");

  return `// [generated] generator=PersistenceGenerator template=persistence_nosql_hive.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Hand-written Hive TypeAdapter for ${entity.name} (NoSQL persistence, §5.2-F2) — no
// hive_ce_generator codegen required, so this compiles standalone.${skipNote}
import 'package:hive_ce/hive_ce.dart';
${entityImport}${enumImports ? "\n" + enumImports : ""}

class ${entity.name}Adapter extends TypeAdapter<${entity.name}> {
  @override
  final int typeId = ${typeId};

  @override
  ${entity.name} read(BinaryReader reader) {
    final map = reader.readMap().cast<String, dynamic>();
    return ${entity.name}(
${ctorArgs}
    );
  }

  @override
  void write(BinaryWriter writer, ${entity.name} obj) {
    writer.writeMap(<String, dynamic>{
${writeEntries}
    });
  }
}
`;
}
