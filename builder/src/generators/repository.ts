import { RepositoryModel, OperationModel, OperationParam } from "../types";
import { importsFromTypes, PkgContext } from "../dart";

function paramStr(p: OperationParam): string {
  if (p.named === false) return `${p.type} ${p.name}`;
  if (p.required) return `required ${p.type} ${p.name}`;
  if (p.default !== undefined) return `${p.type} ${p.name} = ${p.default}`;
  return `${p.type}? ${p.name}`; // optional named → nullable (non-nullable needs required/default)
}

function operationStr(op: OperationModel): string {
  const positional = op.params.filter((p) => p.named === false);
  const named = op.params.filter((p) => p.named !== false);
  const pos = positional.map(paramStr).join(", ");
  const nam = named.map(paramStr).join(", ");
  const sig = nam.length ? `${pos}${pos ? ", " : ""}{${nam}}` : pos;
  return `  ${op.returns} ${op.name}(${sig});`;
}

/**
 * RepositoryContractGenerator — structural, deterministic, 0% LLM.
 * IR RepositoryModel → abstract repository interface with faithful signatures.
 */
export function generateRepository(repo: RepositoryModel, ctx?: PkgContext): string {
  const methods = repo.operations.map(operationStr).join("\n");

  const types: string[] = [];
  for (const op of repo.operations) {
    types.push(op.returns);
    for (const p of op.params) types.push(p.type);
  }
  const imports = importsFromTypes(types, ctx).join("\n");

  return `// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
${imports}

abstract interface class ${repo.name} {
${methods}
}
`;
}
