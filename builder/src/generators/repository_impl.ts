import { RepositoryImplModel, RepositoryModel, OperationModel, OperationParam, EntityModel } from "../types";
import { GenContext, variantSampleArgs, importsFromTypes } from "../dart";
import { crudOperations, listEntityName } from "../operations";

/**
 * RepositoryImplGenerator — structural, deterministic, 0% LLM.
 * Implements a repository contract's full CRUD surface (list/get/create/update/delete, whichever
 * are declared — §5.2-F1) against a private, mutable in-memory list: create/update/delete mutate
 * `_items` so subsequent list/get calls on the same instance see the change. This is the
 * "in-memory fallback" DESIGN §5.2-F2/PERSISTENCE_ARCH.md keeps live even when persistence is
 * sql/nosql, so CDP/widget tests stay deterministic regardless of the persistence backend
 * selected (the drift/hive schema files are generated separately — see generators/persistence.ts
 * — and are not wired into this class). Non-CRUD custom operations (submitFeedback, restock, ...)
 * still fall through to noSuchMethod until hand-wired to a real datasource.
 * Also exports generateInMemoryRepository for contracts with no declared impl.
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
  const entityName = repo ? listEntityName(repo) : null;
  const entity = (ctx?.ir?.entities ?? []).find((e: any) => e.name === entityName) as EntityModel | undefined;
  const identityField = entity?.identity?.field ?? "id";
  const ready = !!(entityName && entity);

  const kinds = repo && entityName ? crudOperations(repo, entityName) : {};
  const implementedOps: OperationModel[] = [];
  const methods: string[] = [];

  if (ready && kinds.list) {
    implementedOps.push(kinds.list);
    methods.push(`  @override\n  Future<List<${entityName}>> ${kinds.list.name}(${opSig(kinds.list)}) async => List.unmodifiable(_items);`);
  }

  if (ready && kinds.get) {
    implementedOps.push(kinds.get);
    const idParam = kinds.get.params[0]?.name ?? "id";
    methods.push(
      `  @override\n  Future<${entityName}> ${kinds.get.name}(${opSig(kinds.get)}) async =>\n` +
      `      _items.firstWhere((e) => e.${identityField} == ${idParam}, orElse: () => _items.first);`,
    );
  }

  if (ready && kinds.create) {
    implementedOps.push(kinds.create);
    const paramName = kinds.create.params.find((p) => p.type === entityName)?.name ?? "item";
    const voidReturn = kinds.create.returns === "Future<void>";
    methods.push(
      `  @override\n  Future<${voidReturn ? "void" : entityName}> ${kinds.create.name}(${opSig(kinds.create)}) async {\n` +
      `    _items.add(${paramName});\n` +
      (voidReturn ? `  }` : `    return ${paramName};\n  }`),
    );
  }

  if (ready && kinds.update) {
    implementedOps.push(kinds.update);
    const paramName = kinds.update.params.find((p) => p.type === entityName)?.name ?? "item";
    const voidReturn = kinds.update.returns === "Future<void>";
    methods.push(
      `  @override\n  Future<${voidReturn ? "void" : entityName}> ${kinds.update.name}(${opSig(kinds.update)}) async {\n` +
      `    final idx = _items.indexWhere((e) => e.${identityField} == ${paramName}.${identityField});\n` +
      `    if (idx != -1) _items[idx] = ${paramName};\n` +
      (voidReturn ? `  }` : `    return ${paramName};\n  }`),
    );
  }

  if (ready && kinds.delete) {
    implementedOps.push(kinds.delete);
    const idParam = kinds.delete.params[0]?.name ?? "id";
    methods.push(
      `  @override\n  Future<void> ${kinds.delete.name}(${opSig(kinds.delete)}) async {\n` +
      `    _items.removeWhere((e) => e.${identityField} == ${idParam});\n` +
      `  }`,
    );
  }

  const itemsField = ready ? `  final List<${entityName}> _items = [${demoRows(entityName!, entity!, ctx)}];\n\n` : "";

  const imp = (n: string) => (ctx?.symbols.get(n) ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(n)}';` : `import '${n.toLowerCase()}.dart';`);

  const refTypes: string[] = [];
  if (entityName) refTypes.push(entityName);
  if (entity) {
    for (const f of entity.fields as any[]) {
      if (f.semanticType) refTypes.push(f.semanticType);
      else if (f.type === "enum") refTypes.push(f.of || f.name.charAt(0).toUpperCase() + f.name.slice(1));
    }
  }
  // Param + return types of the implemented (CRUD-classified) operations only, so the method
  // signatures compile without dragging in types for ops that still fall through to noSuchMethod.
  for (const op of implementedOps) {
    refTypes.push(op.returns);
    for (const p of op.params) refTypes.push(p.type);
  }
  const entityImports = importsFromTypes(refTypes, ctx).join("\n");

  const methodBlock = methods.join("\n\n");

  return `// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
${imp(contract)}
${entityImports}

class ${implName} implements ${contract} {
${itemsField}${methodBlock}

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
`;
}
