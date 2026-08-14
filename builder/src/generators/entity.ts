import { EntityModel } from "../types";
import { fieldDartType, referencedType, nullable, defaultValue, importsFromTypes, GenContext } from "../dart";

/**
 * EntityGenerator — structural, deterministic, 0% LLM.
 * IR EntityModel → immutable Dart entity class with Equatable + correct imports.
 */
export function generateEntity(entity: EntityModel, ctx?: GenContext): string {
  const className = entity.name;
  const identity = entity.identity?.field;
  const equality = entity.equality ?? "identity";

  const imports = importsFromTypes(
    entity.fields.map(referencedType).filter((t): t is string => !!t && t !== className),
    ctx
  ).join("\n");

  const ctorParams = entity.fields
    .map((f) => {
      if (f.required && !nullable(f)) return `    required this.${f.name},`;
      const dflt = defaultValue(f);
      if (dflt) return `    this.${f.name} = ${dflt},`;
      return `    this.${f.name},`;
    })
    .join("\n");

  const finalFields = entity.fields
    .map((f) => `  final ${fieldDartType(f)}${nullable(f) ? "?" : ""} ${f.name};`)
    .join("\n");

  const propsList = entity.fields.map((f) => f.name).join(", ");
  const propsSource =
    equality === "full"
      ? `[${propsList}]`
      : identity
        ? `[${identity}]`
        : "const []";

  return `// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
${imports ? "\n" + imports : ""}

class ${className} extends Equatable {
  const ${className}({
${ctorParams}
  });

${finalFields}

  @override
  List<Object?> get props => ${propsSource};
}
`;
}
