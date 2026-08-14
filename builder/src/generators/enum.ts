import { EnumModel } from "../types";

/**
 * EnumGenerator — structural, deterministic, 0% LLM.
 * IR EnumModel → Dart enum.
 */
export function generateEnum(e: EnumModel): string {
  const values = e.values.map((v) => `  ${v}`).join(",\n");
  return `// [generated] generator=EnumGenerator template=enum.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
enum ${e.name} {
${values},
}
`;
}
