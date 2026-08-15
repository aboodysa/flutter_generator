import { RepositoryImplModel, RepositoryModel, OperationModel, OperationParam, EntityModel } from "../types";
import { GenContext, variantSampleArgs, importsFromTypes } from "../dart";

/**
 * RepositoryImplGenerator — structural, deterministic, 0% LLM.
 * Implements a repository contract's LIST + GET operations with deterministic in-memory demo
 * data (moved out of the cubit so data flows cubit → use case → repository → impl). Remaining
 * operations (create/update/delete/stream) fall through to noSuchMethod until wired to a real
 * datasource. Also exports generateInMemoryRepository for contracts with no declared impl.
 */

function paramStr(p: OperationParam): string {
  if (p.named === false) return `${p.type} ${p.name}`;
  if (p.required) return `required ${p.type} ${p.name}`;
  if (p.default !== undefined) return `${p.type} ${p.name} = ${p.default}`;
  return `${p.type}? ${p.name}`; // optional named → nullable
}

function opSig(op: OperationModel): string {
  const positional = op.params.filter((p) => p.named === false).map(paramStr).join(", ");
  const named = op.params.filter((p) => p.named !== false).map(paramStr).join(", ");
  return named.length ? `${positional}${positional ? ", " : ""}{${named}}` : positional;
}

function listEntity(repo: RepositoryModel | undefined): { name: string | null; op: OperationModel | null } {
  const op = repo?.operations.find((o) => /List<[A-Z]\w*>/.test(o.returns)) ?? null;
  const name = op ? op.returns.match(/List<([A-Z]\w*)>/)?.[1] ?? null : null;
  return { name, op };
}

function demoRows(entityName: string, entity: EntityModel, ctx: GenContext | undefined): string {
  return [0, 1, 2]
    .map((i) => `${entityName}(${variantSampleArgs(entity, ctx?.ir?.enums ?? [], ctx?.ir?.valueObjects ?? [], i)})`)
    .join(", ");
}

export function generateRepositoryImpl(ri: RepositoryImplModel, ctx?: GenContext): string {
  return buildImpl(ri.name, ri.contract, ctx);
}

/** An in-memory implementation for a repository with no declared impl (used for the demo). */
export function generateInMemoryRepository(repo: RepositoryModel, ctx?: GenContext): string {
  return buildImpl(`${repo.name}InMemoryImpl`, repo.name, ctx);
}

function buildImpl(implName: string, contract: string, ctx?: GenContext): string {
  const repo = (ctx?.ir?.repositories ?? []).find((r: any) => r.name === contract) as RepositoryModel | undefined;
  const { name: entityName, op: listOp } = listEntity(repo);
  const entity = (ctx?.ir?.entities ?? []).find((e: any) => e.name === entityName) as EntityModel | undefined;

  const methods: string[] = [];
  if (listOp && entityName && entity) {
    methods.push(`  @override\n  Future<List<${entityName}>> ${listOp.name}(${opSig(listOp)}) async => [${demoRows(entityName, entity, ctx)}];`);
    const getOp = repo?.operations.find((o) => new RegExp(`Future<${entityName}>`).test(o.returns) && o !== listOp);
    if (getOp) {
      methods.push(`  @override\n  Future<${entityName}> ${getOp.name}(${opSig(getOp)}) async => ${entityName}(${variantSampleArgs(entity, ctx?.ir?.enums ?? [], ctx?.ir?.valueObjects ?? [], 0)});`);
    }
  }

  const imp = (n: string) => (ctx?.symbols.get(n) ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(n)}';` : `import '${n.toLowerCase()}.dart';`);

  const refTypes: string[] = [];
  if (entityName) refTypes.push(entityName);
  if (entity) {
    for (const f of entity.fields as any[]) {
      if (f.semanticType) refTypes.push(f.semanticType);
      else if (f.type === "enum") refTypes.push(f.of || f.name.charAt(0).toUpperCase() + f.name.slice(1));
    }
  }
  // Param + return types of the implemented operations only (list + get), so the method
  // signatures compile without dragging in types for ops that still fall through to noSuchMethod.
  for (const op of [listOp, repo?.operations.find((o) => new RegExp(`Future<${entityName}>`).test(o.returns) && o !== listOp)].filter((o): o is OperationModel => !!o)) {
    refTypes.push(op.returns);
    for (const p of op.params) refTypes.push(p.type);
  }
  const entityImports = importsFromTypes(refTypes, ctx).join("\n");

  const methodBlock = methods.join("\n\n");

  return `// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — swap for a real
// datasource by editing the generated methods.
${imp(contract)}
${entityImports}

class ${implName} implements ${contract} {
${methodBlock}

  // Remaining operations (create/update/delete/stream) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
`;
}
