import { EntityModel, Field, ModelModel } from "../types";
import { DART_TYPES, capitalize, nullable, voBaseType, fileName, defaultValue, importsFromTypes, GenContext } from "../dart";

function modelType(f: Field): string {
  if (f.semanticType) return f.semanticType;
  switch (f.type) {
    case "enum":
      return f.of || capitalize(f.name);
    case "List":
      return `List<${capitalize((f.of || "dynamic").trim())}Model>`;
    case "reference":
      return `${f.of}Model`;
    default:
      return DART_TYPES[f.type];
  }
}

function jsonKey(f: Field, override: ModelModel | undefined): string {
  return override?.jsonKeys?.[f.name] ?? f.name;
}

// Lenient read: primary key ?? accepted keys, then convert (v3.3 acceptedKeys).
// Handles nullability and defaults correctly.
function readExpr(f: Field, override: ModelModel | undefined): string {
  const alts = override?.acceptedKeys?.[f.name] ?? [];
  const chain =
    `json['${jsonKey(f, override)}']` + (alts.length ? ` ?? ${alts.map((a) => `json['${a}']`).join(" ?? ")}` : "");
  const raw = alts.length ? `(${chain})` : chain;
  const isNull = nullable(f);
  const dflt = defaultValue(f);

  // semanticType takes precedence over the primitive type.
  if (f.semanticType) {
    const base = voBaseType(f.semanticType, []);
    const cast = base === "double" ? `(${raw} as num).toDouble()` : `${raw} as ${base}`;
    return `${f.semanticType}(${cast})`;
  }

  const prim = (dart: string, dfltExpr: string) => {
    if (isNull) return `${raw} as ${dart}?`;
    if (dflt) return `${raw} as ${dart}? ?? ${dfltExpr}`;
    return `${raw} as ${dart}`;
  };

  switch (f.type) {
    case "String":
      return prim("String", `'${f.default ?? ""}'`);
    case "int":
      return prim("int", `${f.default ?? 0}`);
    case "double":
      return isNull ? `(${raw} as num?)?.toDouble()` : `(${raw} as num).toDouble()`;
    case "bool":
      return prim("bool", `${f.default ?? false}`);
    case "DateTime":
      return isNull ? `(${raw} as String?) != null ? DateTime.parse(${raw} as String) : null` : `DateTime.parse(${raw} as String)`;
    case "enum":
      return `${f.of || capitalize(f.name)}.values.byName(${raw} as String)`;
    case "reference":
      return isNull
        ? `(${raw}) != null ? ${f.of}Model.fromJson(${raw} as Map<String, dynamic>) : null`
        : `${f.of}Model.fromJson(${raw} as Map<String, dynamic>)`;
    case "List":
      return `(${raw} as List?)?.map((e) => ${capitalize((f.of || "dynamic").trim())}Model.fromJson(e as Map<String, dynamic>)).toList() ?? const []`;
  }
  throw new Error(`[model] unsupported field type '${f.type}' on ${f.name}`);
}

function writeExpr(f: Field): string {
  const access = nullable(f) ? `${f.name}?` : f.name;
  switch (f.type) {
    case "DateTime":
      return `${access}.toIso8601String()`;
    case "enum":
      return `${access}.name`;
    case "reference":
      return `${access}.toJson()`;
    case "List":
      return `${f.name}.map((e) => e.toJson()).toList()`;
    default:
      return f.semanticType ? `${access}.value` : f.name;
  }
}

// Imports: self entity (for toEntity/fromEntity) + nested refs/enums/VOs.
function modelRefs(entity: EntityModel): string[] {
  const refs: string[] = [entity.name];
  for (const f of entity.fields) {
    if (f.semanticType) refs.push(f.semanticType);
    else if (f.type === "enum") refs.push(f.of || capitalize(f.name));
    else if (f.type === "reference") refs.push(`${f.of}Model`);
    else if (f.type === "List") refs.push(`${capitalize((f.of || "dynamic").trim())}Model`);
  }
  return refs;
}

// Model → Entity field expression (nested models call .toEntity()).
function toEntityExpr(f: Field): string {
  if (f.type === "reference") return `${f.name}?.toEntity()`;
  if (f.type === "List") return `${f.name}.map((e) => e.toEntity()).toList()`;
  return f.name;
}

// Entity → Model field expression (nested entities wrap in XModel.fromEntity()).
function fromEntityExpr(f: Field): string {
  if (f.type === "reference") {
    const m = `${f.of}Model`;
    return nullable(f) ? `e.${f.name} != null ? ${m}.fromEntity(e.${f.name}!) : null` : `${m}.fromEntity(e.${f.name})`;
  }
  if (f.type === "List") {
    const m = `${capitalize((f.of || "dynamic").trim())}Model`;
    return `e.${f.name}.map((x) => ${m}.fromEntity(x)).toList()`;
  }
  return `e.${f.name}`;
}

/**
 * ModelGenerator — structural, deterministic, 0% LLM.
 * IR EntityModel (+ optional jsonKeys/acceptedKeys overrides) → DTO with fromJson/toJson + entity mapping.
 */
export function generateModel(entity: EntityModel, override: ModelModel | undefined, ctx?: GenContext): string {
  const name = `${entity.name}Model`;

  const ctorParams = entity.fields
    .map((f) => {
      if (f.required && !nullable(f)) return `    required this.${f.name},`;
      const dflt = defaultValue(f);
      if (dflt) return `    this.${f.name} = ${dflt},`;
      return `    this.${f.name},`;
    })
    .join("\n");

  const fields = entity.fields
    .map((f) => `  final ${modelType(f)}${nullable(f) ? "?" : ""} ${f.name};`)
    .join("\n");

  const fromJsonParams = entity.fields
    .map((f) => `      ${f.name}: ${readExpr(f, override)},`)
    .join("\n");

  const toJsonBody = entity.fields
    .map((f) => `      '${jsonKey(f, override)}': ${writeExpr(f)},`)
    .join("\n");

  const toEntityParams = entity.fields
    .map((f) => `    ${f.name}: ${toEntityExpr(f)},`)
    .join("\n");

  const fromEntityParams = entity.fields
    .map((f) => `    ${f.name}: ${fromEntityExpr(f)},`)
    .join("\n");

  const imports = importsFromTypes(modelRefs(entity), ctx).join("\n");

  return `// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
${imports ? imports + "\n" : ""}
class ${name} {
  const ${name}({
${ctorParams}
  });

${fields}

  factory ${name}.fromJson(Map<String, dynamic> json) => ${name}(
${fromJsonParams}
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
${toJsonBody}
  };

  ${entity.name} toEntity() => ${entity.name}(
${toEntityParams}
  );

  factory ${name}.fromEntity(${entity.name} e) => ${name}(
${fromEntityParams}
  );
}
`;
}
