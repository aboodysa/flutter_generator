import { ValueObjectModel, Invariant } from "../types";

const BASE_DART: Record<string, string> = {
  String: "String",
  int: "int",
  double: "double",
  DateTime: "DateTime",
};

function invariantAssert(name: string, inv: Invariant): string {
  switch (inv.kind) {
    case "min":
      return `assert(value >= ${inv.value}, '${name} must be >= ${inv.value}'),`;
    case "max":
      return `assert(value <= ${inv.value}, '${name} must be <= ${inv.value}'),`;
    case "nonEmpty":
      return `assert(value.isNotEmpty, '${name} must not be empty'),`;
    case "regex":
      return `assert(RegExp(r'${inv.value}').hasMatch(value), '${name} must match ${inv.value}'),`;
    default:
      throw new Error(`[valueObject] unhandled invariant kind '${(inv as any).kind}'`);
  }
}

/**
 * ValueObjectGenerator — structural, deterministic, 0% LLM.
 * IR ValueObjectModel → immutable Dart value object with declared invariants.
 */
export function generateValueObject(vo: ValueObjectModel): string {
  const t = BASE_DART[vo.baseType] ?? "String";
  const asserts = (vo.invariants ?? [])
    .map((i) => invariantAssert(vo.name, i))
    .join("\n  ");

  const ctor = asserts
    ? `  const ${vo.name}(this.value)\n      : ${asserts.slice(0, -1)};`
    : `  const ${vo.name}(this.value);`;

  return `// [generated] generator=ValueObjectGenerator template=value_object.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
class ${vo.name} {
${ctor}

  final ${t} value;

  @override
  bool operator ==(Object other) => other is ${vo.name} && other.value == value;

  @override
  int get hashCode => value.hashCode;

  @override
  String toString() => value.toString();
}
`;
}
