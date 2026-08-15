import { QueryModel, DataField } from "../types";
import { importsFromTypes, PkgContext } from "../dart";

/**
 * QueryGenerator — structural, deterministic, 0% LLM.
 * IR QueryModel → plain query VO class with copyWith + optional wire-param mapping.
 */
export function generateQuery(q: QueryModel, ctx?: PkgContext): string {
  const ctorParams = q.fields
    .map((f) => {
      if (f.default !== undefined) return `    this.${f.name} = ${f.default},`;
      if (f.type.endsWith("?")) return `    this.${f.name},`;
      return `    required this.${f.name},`;
    })
    .join("\n");

  const fields = q.fields.map((f) => `  final ${f.type} ${f.name};`).join("\n");

  const copyWithParams = q.fields
    .map((f) => {
      const nt = f.type.endsWith("?") ? f.type : `${f.type}?`;
      return `    ${nt} ${f.name},`;
    })
    .join("\n");

  const copyWithAssign = q.fields
    .map((f) => (f.type.endsWith("?") ? `    ${f.name}: ${f.name},` : `    ${f.name}: ${f.name} ?? this.${f.name},`))
    .join("\n");

  const paramsMap = q.paramMap ?? {};
  const toQueryParamsBody = q.fields
    .map((f) => {
      const wire = paramsMap[f.name] ?? f.name;
      if (f.type.endsWith("?")) {
        return `    if (${f.name} != null) params['${wire}'] = ${f.name};`;
      }
      return `    params['${wire}'] = ${f.name};`;
    })
    .join("\n");

  const imports = importsFromTypes(q.fields.map((f) => f.type), ctx).join("\n");

  return `// [generated] generator=QueryGenerator template=query.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
${imports ? imports + "\n" : ""}
class ${q.name} {
${fields}

  const ${q.name}({
${ctorParams}
  });

  ${q.name} copyWith({
${copyWithParams}
  }) => ${q.name}(
${copyWithAssign}
  );

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
${toQueryParamsBody}
    return params;
  }
}
`;
}
