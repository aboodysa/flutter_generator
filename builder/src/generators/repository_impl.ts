import { RepositoryImplModel, RepositoryModel, OperationModel, OperationParam, EntityModel } from "../types";
import { GenContext, variantSampleArgs, importsFromTypes } from "../dart";
import { crudOperations, listEntityName, hasTenantScoping, authTenantIds, resolveBudget, isAudited, exportLockedEntity, hasOutbox } from "../operations";

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
 *
 * MF2 (tenant scoping): when the entity carries a `tenantId` field (operations.ts's
 * hasTenantScoping), every CRUD operation becomes session-scoped — list/get filter rows to the
 * signed-in Session's tenant, create/update stamp `tenantId` (an attacker-friendly client value
 * is overwritten with the session's own), and update/delete refuse rows outside it. An
 * unauthenticated session (generated widget tests, vanilla flows) sees everything, so non-auth
 * behavior only changes for apps whose IR opts into auth. Demo seed rows are cycled across the
 * auth personas' tenants so each demo account "owns" a subset — the first iPhone impression of
 * tenant isolation.
 *
 * L3 (audit): when the entity opts into `audited: true`, every create/update/delete also builds
 * an AuditEvent (before/after snapshots via `${Entity}Model.fromEntity(e).toJson()`, actor from
 * the signed-in Session) and appends it to the app-wide AuditLog — a compliance record of who
 * changed what, independent of whether that entity is also export-locked.
 *
 * L3 (export immutability): when the entity is shown by a resolved `export:` list screen
 * (operations.ts's exportLockedEntity), update/delete first check the row's own `exported` field —
 * a row that's already been exported throws (StateError), the same "loud failure over silent wrong
 * behavior" posture `[money]`/`[oracle]` hold elsewhere. The generated form's saveGuard is the
 * primary defense (disables Save before the user can even attempt it); this is defense in depth
 * against any other code path reaching the repo directly.
 *
 * MF6 (outbox): when the app opts into `attributes.outbox: true` (app-level, every entity),
 * create/update/delete write-ahead-enqueue an OutboxMessage into the app-wide Outbox BEFORE the
 * in-memory list is mutated — a write that's about to be rejected (the export-immutability throw
 * above) never gets logged, only writes that actually happen do.
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

// MF5: hand-picked (not the generic per-index Money(index*10000+5000,...) formula) so the 3 demo
// rows show a real spread of budget states — under/near/over the limit. The generic formula gives
// every Money field on an entity the SAME literal for a given row (it doesn't vary by field name),
// which for a 3-money-field budget entity would put committed+actual at exactly 2x the limit on
// every row — always "over", never a realistic demo.
const BUDGET_SEED = [
  { limit: 100000, committed: 20000, actual: 38000 }, // under: 58% used
  { limit: 60000, committed: 15000, actual: 44000 }, // near: 98% used
  { limit: 40000, committed: 10000, actual: 35000 }, // over: 112% used
];

function demoRows(entityName: string, entity: EntityModel, ctx: GenContext | undefined): string {
  const scoped = hasTenantScoping(ctx?.ir, entityName);
  const tenants = ctx?.ir ? authTenantIds(ctx.ir) : [];
  const budget = ctx?.ir ? resolveBudget(ctx.ir) : undefined;
  const isBudgetEntity = !!budget && budget.entity.name === entityName;
  return [0, 1, 2]
    .map((i) => {
      // MF2: cycle demo rows across the auth personas' tenants so the seed data itself demos
      // tenant isolation (each account sees only the rows its own tenant "owns"). No-op for
      // non-scoped entities — output byte-identical to pre-MF2.
      const overrides: Record<string, string> = {};
      if (scoped && tenants.length) overrides.tenantId = `'${tenants[i % tenants.length]}'`;
      if (isBudgetEntity && budget) {
        const seed = BUDGET_SEED[i]!;
        overrides[budget.limitField.name] = `Money(minorUnits: ${seed.limit}, currency: '${budget.limitField.currency}')`;
        overrides[budget.committedField.name] = `Money(minorUnits: ${seed.committed}, currency: '${budget.committedField.currency}')`;
        overrides[budget.actualField.name] = `Money(minorUnits: ${seed.actual}, currency: '${budget.actualField.currency}')`;
      }
      const finalOverrides = Object.keys(overrides).length ? overrides : undefined;
      return `${entityName}(${variantSampleArgs(entity, ctx?.ir?.enums ?? [], ctx?.ir?.valueObjects ?? [], i, finalOverrides)})`;
    })
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
  const scoped = ready && entity ? hasTenantScoping(ctx?.ir, entityName) : false;
  // L3: audited (recordMutation on every CRUD write) and export-locked (reject a write once
  // `exported == true`) are independent per-entity facts — an entity can be neither, either, or
  // both. Both default false/undefined (no ctx.ir, e.g. a bare unit-test call site), so every
  // existing call site without an IR stays on the pre-L3 code path unchanged.
  const audited = ready && ctx?.ir ? isAudited(ctx.ir, entityName!) : false;
  const exportLock = ready && ctx?.ir ? exportLockedEntity(ctx.ir, entityName!) : undefined;
  // MF6: app-level (unlike audited/exportLock above) — every entity's repo gets the hook when set.
  const outbox = ready && ctx?.ir ? hasOutbox(ctx.ir) : false;
  // Session.actorId is String? even when isAuthenticated is true (Dart can't type-promote across
  // two different getters) — `??` both satisfies the non-nullable `actor` param and covers the
  // same "not signed in" fallback the isAuthenticated ternary would have.
  const actorExpr = "Session.instance.actorId ?? 'system'";
  const implementedOps: OperationModel[] = [];
  const methods: string[] = [];

  if (ready && kinds.list) {
    implementedOps.push(kinds.list);
    methods.push(
      `  @override\n  Future<List<${entityName}>> ${kinds.list.name}(${opSig(kinds.list)}) async => List.unmodifiable(${scoped ? "_items.where(_inScope)" : "_items"});`,
    );
  }

  if (ready && kinds.get) {
    implementedOps.push(kinds.get);
    const idParam = kinds.get.params[0]?.name ?? "id";
    methods.push(
      `  @override\n  Future<${entityName}> ${kinds.get.name}(${opSig(kinds.get)}) async =>\n` +
      `      _items.firstWhere((e) => e.${identityField} == ${idParam}${scoped ? " && _inScope(e)" : ""}, orElse: () => ${scoped ? "_items.firstWhere(_inScope)" : "_items.first"});`,
    );
  }

  if (ready && kinds.create) {
    implementedOps.push(kinds.create);
    const paramName = kinds.create.params.find((p) => p.type === entityName)?.name ?? "item";
    const voidReturn = kinds.create.returns === "Future<void>";
    const stamped = scoped ? `_stampTenant(${paramName})` : paramName;
    const auditAppend = audited
      ? `    AuditLog.instance.append(recordMutation(\n` +
        `      entity: '${entityName}',\n` +
        `      entityId: ${stamped}.${identityField}.toString(),\n` +
        `      action: 'create',\n` +
        `      actor: ${actorExpr},\n` +
        `      after: ${entityName}Model.fromEntity(${stamped}).toJson(),\n` +
        `    ));\n`
      : "";
    // MF6: write-ahead — enqueued BEFORE `_items.add`, so the outbox reflects intent even if a
    // later step in the method somehow failed to complete.
    const outboxEnqueue = outbox
      ? `    Outbox.instance.enqueue(\n` +
        `      entity: '${entityName}',\n` +
        `      entityId: ${stamped}.${identityField}.toString(),\n` +
        `      action: 'create',\n` +
        `      payload: ${entityName}Model.fromEntity(${stamped}).toJson(),\n` +
        `    );\n`
      : "";
    methods.push(
      `  @override\n  Future<${voidReturn ? "void" : entityName}> ${kinds.create.name}(${opSig(kinds.create)}) async {\n` +
      outboxEnqueue +
      `    _items.add(${stamped});\n` +
      auditAppend +
      (voidReturn ? `  }` : `    return ${stamped};\n  }`),
    );
  }

  if (ready && kinds.update) {
    implementedOps.push(kinds.update);
    const paramName = kinds.update.params.find((p) => p.type === entityName)?.name ?? "item";
    const voidReturn = kinds.update.returns === "Future<void>";
    // L3 (export immutability): checked BEFORE the write — a row already stamped `exported` can
    // never be overwritten again, defense in depth behind the form's saveGuard (which is the
    // primary defense: the user can't even reach Save on an exported record).
    const exportGuard = exportLock
      ? `    if (idx != -1 && _items[idx].exported == true) {\n` +
        `      throw StateError('${entityName} \${_items[idx].${identityField}} is exported and immutable — corrections require void + clone, not edit.');\n` +
        `    }\n`
      : "";
    // L3 (audit): the pre-write snapshot has to be captured before `_items[idx]` is overwritten.
    const auditBefore = audited
      ? `    final before = idx != -1 ? ${entityName}Model.fromEntity(_items[idx]).toJson() : null;\n`
      : "";
    const auditAppend = audited
      ? `    if (idx != -1) {\n` +
        `      AuditLog.instance.append(recordMutation(\n` +
        `        entity: '${entityName}',\n` +
        `        entityId: ${paramName}.${identityField}.toString(),\n` +
        `        action: 'update',\n` +
        `        actor: ${actorExpr},\n` +
        `        before: before,\n` +
        `        after: ${entityName}Model.fromEntity(${scoped ? `_stampTenant(${paramName})` : paramName}).toJson(),\n` +
        `      ));\n` +
        `    }\n`
      : "";
    // MF6: write-ahead — after the export guard (a rejected write is never logged) but before the
    // mutation itself; gated on idx != -1 like auditAppend above (nothing to enqueue for a target
    // row that doesn't exist).
    const outboxEnqueue = outbox
      ? `    if (idx != -1) {\n` +
        `      Outbox.instance.enqueue(\n` +
        `        entity: '${entityName}',\n` +
        `        entityId: ${paramName}.${identityField}.toString(),\n` +
        `        action: 'update',\n` +
        `        payload: ${entityName}Model.fromEntity(${scoped ? `_stampTenant(${paramName})` : paramName}).toJson(),\n` +
        `      );\n` +
        `    }\n`
      : "";
    methods.push(
      `  @override\n  Future<${voidReturn ? "void" : entityName}> ${kinds.update.name}(${opSig(kinds.update)}) async {\n` +
      `    final idx = _items.indexWhere((e) => e.${identityField} == ${paramName}.${identityField}${scoped ? " && _inScope(e)" : ""});\n` +
      exportGuard +
      outboxEnqueue +
      auditBefore +
      `    if (idx != -1) _items[idx] = ${scoped ? `_stampTenant(${paramName})` : paramName};\n` +
      auditAppend +
      (voidReturn ? `  }` : `    return ${paramName};\n  }`),
    );
  }

  if (ready && kinds.delete) {
    implementedOps.push(kinds.delete);
    const idParam = kinds.delete.params[0]?.name ?? "id";
    const scopedCond = scoped ? " && _inScope(e)" : "";
    // Only needed (and only emitted) when this delete must check export-lock, enqueue an outbox
    // message, or record an audit event — `removeWhere` alone never gives back a reference to
    // what it removed.
    const findExisting = exportLock || audited || outbox
      ? `    final _matches = _items.where((e) => e.${identityField} == ${idParam}${scopedCond});\n` +
        `    final _existing = _matches.isEmpty ? null : _matches.first;\n`
      : "";
    const exportGuard = exportLock
      ? `    if (_existing != null && _existing.exported == true) {\n` +
        `      throw StateError('${entityName} \${${idParam}} is exported and immutable — corrections require void + clone, not delete.');\n` +
        `    }\n`
      : "";
    // MF6: write-ahead — after the export guard, before `_items.removeWhere`. No payload — the
    // row is about to be gone; entityId is all a delete replay needs to identify the target.
    const outboxEnqueue = outbox
      ? `    if (_existing != null) {\n` +
        `      Outbox.instance.enqueue(entity: '${entityName}', entityId: ${idParam}.toString(), action: 'delete');\n` +
        `    }\n`
      : "";
    const auditAppend = audited
      ? `    if (_existing != null) {\n` +
        `      AuditLog.instance.append(recordMutation(\n` +
        `        entity: '${entityName}',\n` +
        `        entityId: ${idParam}.toString(),\n` +
        `        action: 'delete',\n` +
        `        actor: ${actorExpr},\n` +
        `        before: ${entityName}Model.fromEntity(_existing).toJson(),\n` +
        `      ));\n` +
        `    }\n`
      : "";
    methods.push(
      `  @override\n  Future<void> ${kinds.delete.name}(${opSig(kinds.delete)}) async {\n` +
      findExisting +
      exportGuard +
      outboxEnqueue +
      `    _items.removeWhere((e) => e.${identityField} == ${idParam}${scoped ? " && _inScope(e)" : ""});\n` +
      auditAppend +
      `  }`,
    );
  }

  // MF2: the two tenant-scope helpers every scoped repo gets — `_inScope` (the readonly filter)
  // and `_stampTenant` (reconstructs the entity with the session's own tenantId, overriding any
  // client-supplied value). Unscoped repos emit neither (byte-identical output).
  const scopeHelpers = scoped
    ? `\n  bool _inScope(${entityName} e) => !Session.instance.isAuthenticated || e.tenantId == Session.instance.tenantId;\n\n  ${entityName} _stampTenant(${entityName} e) => Session.instance.isAuthenticated\n      ? ${entityName}(\n${(entity?.fields ?? [])
        .map((f) => `        ${f.name}: ${f.name === "tenantId" ? "Session.instance.tenantId" : `e.${f.name}`},`)
        .join("\n")}\n      )\n      : e;`
    : "";

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
  if (scoped || audited) refTypes.push("Session");
  // L3: `AuditLog` pulls in the whole core/audit.dart file (AuditEvent + recordMutation live
  // there too, importsFromTypes only needs one name per file to resolve the import), and
  // `${entityName}Model` is the data-layer JSON snapshot before/after captures from.
  if (audited) refTypes.push("AuditLog", `${entityName}Model`);
  // MF6: `Outbox` pulls in core/outbox.dart (OutboxMessage/OutboxStatus live there too); create/
  // update's payload needs `${entityName}Model` same as audit's before/after (harmless if already
  // pushed above — importsFromTypes de-dupes by name). Gated on at least one CRUD kind actually
  // existing (not just `outbox` being true) — a repo with only list/get ops never emits an
  // outboxEnqueue block anywhere, so pushing the import unconditionally would leave an
  // unused-import warning (flutter analyze caught this on ledgerly's read-only Approval/User repos).
  if (outbox && (kinds.create || kinds.update || kinds.delete)) refTypes.push("Outbox", `${entityName}Model`);
  const entityImports = importsFromTypes(refTypes, ctx).join("\n");

  const methodBlock = methods.join("\n\n");

  return `// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
${imp(contract)}
${entityImports}

class ${implName} implements ${contract} {
${itemsField}${methodBlock}${scopeHelpers}

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
`;
}
