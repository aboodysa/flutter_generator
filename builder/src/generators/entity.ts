import { EntityModel } from "../types";
import { fieldDartType, referencedType, nullable, defaultValue, importsFromTypes, GenContext } from "../dart";
import { crudFormTargets } from "../operations";

/**
 * EntityGenerator — structural, deterministic, 0% LLM.
 * IR EntityModel → immutable Dart entity class with Equatable + correct imports.
 */
export function generateEntity(entity: EntityModel, ctx?: GenContext): string {
  const className = entity.name;
  const identity = entity.identity?.field;

  // Full-field equality is required for entities the Cubit/Notifier update() (§5.2-F1 CRUD):
  // Bloc's Cubit.emit() short-circuits (skips the update entirely, no rebuild) when the new
  // state == the old state via Equatable, and a List<Entity> compares element-wise — with
  // identity-only equality ([id]), "same id, different title" looks unchanged, so a genuine
  // field edit silently never reaches the UI. Auto-upgrade CRUD-capable entities to "full"
  // unless the IR explicitly pins a mode (an explicit `equality` always wins).
  const crudCapable = ctx?.ir ? crudFormTargets(ctx.ir).has(entity.name) : false;
  const equality = entity.equality ?? (crudCapable ? "full" : "identity");

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
