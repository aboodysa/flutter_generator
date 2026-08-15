import { WrapperModel } from "../types";
import { importsFromTypes, PkgContext } from "../dart";

/**
 * WrapperGenerator — structural, deterministic, 0% LLM.
 * IR WrapperModel → plain immutable result wrapper class (e.g. TransactionsPage).
 */
export function generateWrapper(w: WrapperModel, ctx?: PkgContext): string {
  const ctorParams = w.fields
    .map((f) => {
      if (f.default !== undefined) return `    this.${f.name} = ${f.default},`;
      if (f.type.endsWith("?")) return `    this.${f.name},`;
      return `    required this.${f.name},`;
    })
    .join("\n");

  const fields = w.fields.map((f) => `  final ${f.type} ${f.name};`).join("\n");
  const imports = importsFromTypes(w.fields.map((f) => f.type), ctx).join("\n");

  return `// [generated] generator=WrapperGenerator template=wrapper.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
${imports ? imports + "\n" : ""}
class ${w.name} {
${fields}

  const ${w.name}({
${ctorParams}
  });
}
`;
}
