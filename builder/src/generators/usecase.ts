import { UseCaseModel } from "../types";
import { importsFromTypes, GenContext } from "../dart";

/**
 * UseCaseGenerator — structural, deterministic, 0% LLM.
 * IR UseCaseModel → a thin callable class delegating to a repository operation.
 */
export function generateUseCase(uc: UseCaseModel, ctx?: GenContext): string {
  const params = uc.paramType === "NoParams" ? "NoParams params" : `${uc.paramType} params`;

  // Look up the repository operation to match its param naming (named vs positional).
  let call = `repository.${uc.operation}(params)`;
  const repo = (ctx?.ir?.repositories ?? []).find((r: any) => r.name === uc.repository);
  const op = repo?.operations?.find((o: any) => o.name === uc.operation);
  const firstParam = op?.params?.[0];
  if (firstParam && firstParam.named) {
    call = `repository.${uc.operation}(${firstParam.name}: params)`;
  }

  const imports = importsFromTypes([uc.repository, uc.paramType, uc.returnType], ctx).join("\n");

  return `// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
${imports}

class ${uc.name} {
  final ${uc.repository} repository;
  const ${uc.name}(this.repository);

  Future<${uc.returnType}> call(${params}) => ${call};
}
`;
}
