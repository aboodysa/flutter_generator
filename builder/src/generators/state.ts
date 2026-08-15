import { StateModel, StateField, EntityModel } from "../types";
import { importsFromTypes, variantSampleArgs, collectionField, camelize, fieldDartType, GenContext } from "../dart";
import { crudOperations, findRepoForEntity } from "../operations";

const DEFAULT_STATUSES = ["initial", "loading", "success", "failure"];

// The three built-in fields every list state has. The collection field is named from the
// entity (Transaction -> transactions, Task -> tasks, Product -> products) via `collectionField`
// — SOLID review #4: it used to be hardcoded to the literal "transactions" for every domain.
function builtinFields(entity: string): StateField[] {
  return [
    { name: "status", type: "STATUS", default: "initial" },
    { name: collectionField(entity), type: `List<${entity}>`, default: "const []" },
    { name: "errorMessage", type: "String?", default: undefined },
  ];
}

// Neutral Dart literal for a query (DataField) type — used to construct a use-case param.
function queryArgLiteral(type: string, ir: any): string {
  if (type.endsWith("?")) return "null"; // nullable field → null
  if (type === "bool") return "false";
  if (type === "int") return "0";
  if (type === "double") return "0.0";
  if (type === "String") return "''";
  if ((ir?.enums ?? []).some((e: any) => e.name === type)) return `${type}.values.first`;
  return "null";
}

/**
 * StateGenerator — structural, deterministic, 0% LLM (enum-status strategy).
 * IR StateModel → enum Status + state class + Cubit/Notifier.
 * §5.2-F1: when the entity's repository declares create/update/delete operations, the
 * Cubit/Notifier also gets create/update/delete methods that mutate the collection field
 * directly (deterministic, testable without DI) and — for bloc, where a matching use case is
 * declared — additionally call through it.
 */
export function generateState(s: StateModel, ctx?: GenContext): string {
  const name = s.name;
  const entity = s.entity;
  const collection = collectionField(entity);
  const statuses = s.statuses ?? DEFAULT_STATUSES;
  const statusEnum = `${name}Status`;
  const stateClass = `${name}State`;
  const cubitClass = `${name}Cubit`;

  // status field type resolves to the enum; all others are IR-declared.
  const fields: StateField[] = builtinFields(entity);
  for (const f of s.extraFields ?? []) fields.push(f);

  const fieldDecl = (f: StateField) => {
    const t = f.type === "STATUS" ? statusEnum : f.type;
    return `  final ${t} ${f.name};`;
  };

  const ctorParam = (f: StateField) => {
    const t = f.type === "STATUS" ? statusEnum : f.type;
    if (f.default !== undefined) return `    this.${f.name} = ${f.name === "status" ? `${statusEnum}.${f.default}` : f.default},`;
    if (t.endsWith("?")) return `    this.${f.name},`;
    return `    required this.${f.name},`;
  };

  const copyWithParam = (f: StateField) => {
    const t = f.type === "STATUS" ? statusEnum : f.type;
    const nt = t.endsWith("?") ? t : `${t}?`;
    return `    ${nt} ${f.name},`;
  };

  const copyWithAssign = (f: StateField) => {
    // errorMessage-style nullable fields use direct assignment (no `??`), per the real pattern.
    return f.type.endsWith("?") ? `    ${f.name}: ${f.name},` : `    ${f.name}: ${f.name} ?? this.${f.name},`;
  };

  const entityModel = (ctx?.ir?.entities ?? []).find((e: any) => e.name === entity) as EntityModel | undefined;
  const identityField = entityModel?.identity?.field ?? "id";
  const identityFieldDef = entityModel?.fields.find((f) => f.name === identityField);
  const identityType = identityFieldDef ? fieldDartType(identityFieldDef) : "String";

  const demoRows = entityModel
    ? [0, 1, 2].map((i) => `${entity}(${variantSampleArgs(entityModel, ctx?.ir?.enums ?? [], ctx?.ir?.valueObjects ?? [], i)})`).join(", ")
    : "null";

  // List use case backing this state (data flow: cubit → use case → repository → in-memory impl).
  const listUseCase = (ctx?.ir?.useCases ?? []).find((u: any) => u.returnType === `List<${entity}>`);
  const paramQuery = listUseCase ? (ctx?.ir?.queries ?? []).find((q: any) => q.name === listUseCase.paramType) : undefined;
  const ucParamExpr = listUseCase
    ? (paramQuery
      ? `${listUseCase.paramType}(${paramQuery.fields.map((f: any) => `${f.name}: ${queryArgLiteral(f.type, ctx?.ir)}`).join(", ")})`
      : listUseCase.paramType === "NoParams" ? "NoParams()" : `const ${listUseCase.paramType}()`)
    : "";

  // Create/update/delete use cases (§5.2-F1) — only when the repository declares the operation
  // AND a use case wraps it. Independent of whether the list itself is repo- or demo-backed.
  const repo = findRepoForEntity(ctx?.ir?.repositories, entity);
  const kinds = repo ? crudOperations(repo, entity) : {};
  const findUc = (opName: string | undefined) =>
    opName && repo ? (ctx?.ir?.useCases ?? []).find((u: any) => u.repository === repo.name && u.operation === opName) : undefined;
  const createUc = findUc(kinds.create?.name);
  const updateUc = findUc(kinds.update?.name);
  const deleteUc = findUc(kinds.delete?.name);

  // Imports: entity + extra field types; demo-construction types (enum/VO) only when the
  // provider seeds demo in the state file; use-case/query types only when bloc uses the repo.
  const sm = ctx?.sm ?? "bloc";
  const usesRepo = sm === "bloc" && !!listUseCase;
  const usesDemo = !usesRepo;
  const refTypes: string[] = [entity, ...(s.extraFields ?? []).map((f) => f.type)];
  if (usesDemo && entityModel) {
    for (const f of entityModel.fields as any[]) {
      if (f.semanticType) refTypes.push(f.semanticType);
      else if (f.type === "enum") refTypes.push(f.of || f.name.charAt(0).toUpperCase() + f.name.slice(1));
    }
  }
  if (usesRepo && listUseCase) {
    refTypes.push(listUseCase.name);
    if (paramQuery) {
      refTypes.push(paramQuery.name);
      for (const f of paramQuery.fields as any[]) {
        if (!String(f.type).endsWith("?")) refTypes.push(f.type);
      }
    } else if (listUseCase.paramType !== "NoParams") {
      refTypes.push(listUseCase.paramType);
    }
  }
  if (sm === "bloc") {
    for (const uc of [createUc, updateUc, deleteUc]) if (uc) refTypes.push(uc.name);
  }
  const imports = importsFromTypes(refTypes, ctx).join("\n");

  const stateBlock = `enum ${statusEnum} { ${statuses.join(", ")} }

class ${stateClass} extends Equatable {
${fields.map(fieldDecl).join("\n")}

  const ${stateClass}({
${fields.map(ctorParam).join("\n")}
  });

  ${stateClass} copyWith({
${fields.map(copyWithParam).join("\n")}
  }) => ${stateClass}(
${fields.map(copyWithAssign).join("\n")}
  );

  @override
  List<Object?> get props => [${fields.map((f) => f.name).join(", ")}];
}`;

  // create/update/delete bodies shared in shape between bloc (Cubit, emit) and riverpod
  // (Notifier, state=) — `assign` is the provider-specific state-write statement.
  const crudMethods = (assign: (expr: string) => string, useUseCases: boolean): string => {
    const parts: string[] = [];
    if (kinds.create) {
      const call = useUseCases && createUc ? `    if (_${camelize(createUc.name)} != null) await _${camelize(createUc.name)}!.call(item);\n` : "";
      parts.push(`  Future<void> create(${entity} item) async {\n${call}    ${assign(`[...state.${collection}, item]`)}\n  }`);
    }
    if (kinds.update) {
      const call = useUseCases && updateUc ? `    if (_${camelize(updateUc.name)} != null) await _${camelize(updateUc.name)}!.call(item);\n` : "";
      parts.push(
        `  Future<void> update(${entity} item) async {\n${call}` +
        `    final idx = state.${collection}.indexWhere((e) => e.${identityField} == item.${identityField});\n` +
        `    if (idx == -1) return;\n` +
        `    final next = List<${entity}>.of(state.${collection})..[idx] = item;\n` +
        `    ${assign("next")}\n  }`,
      );
    }
    if (kinds.delete) {
      const call = useUseCases && deleteUc ? `    if (_${camelize(deleteUc.name)} != null) await _${camelize(deleteUc.name)}!.call(${identityField});\n` : "";
      parts.push(`  Future<void> delete(${identityType} ${identityField}) async {\n${call}    ${assign(`state.${collection}.where((e) => e.${identityField} != ${identityField}).toList()`)}\n  }`);
    }
    return parts.length ? `\n\n${parts.join("\n\n")}` : "";
  };

  // Container differs by provider (arch layer): bloc = Cubit, riverpod = Notifier + provider.
  const container = sm === "riverpod"
    ? `final ${camelize(name)}Provider = NotifierProvider<${name}Notifier, ${stateClass}>(${name}Notifier.new);

class ${name}Notifier extends Notifier<${stateClass}> {
  @override
  ${stateClass} build() => ${stateClass}(
    status: ${statusEnum}.success,
    ${collection}: [${demoRows}],
  );

  Future<void> load() async {
    state = state.copyWith(status: ${statusEnum}.loading);
    try {
      // [user] region:user — replace with real repository call.
      state = state.copyWith(status: ${statusEnum}.success, ${collection}: [${demoRows}]);
    } catch (e) {
      state = state.copyWith(status: ${statusEnum}.failure, errorMessage: e.toString());
    }
  }${crudMethods((expr) => `state = state.copyWith(${collection}: ${expr});`, false)}
}`
    : (() => {
      const requiredParams = listUseCase ? [`this._${camelize(listUseCase.name)}`] : [];
      const optionalParams: string[] = [];
      const optionalFields: string[] = [];
      if (createUc) { optionalParams.push(`this._${camelize(createUc.name)}`); optionalFields.push(`  final ${createUc.name}? _${camelize(createUc.name)};`); }
      if (updateUc) { optionalParams.push(`this._${camelize(updateUc.name)}`); optionalFields.push(`  final ${updateUc.name}? _${camelize(updateUc.name)};`); }
      if (deleteUc) { optionalParams.push(`this._${camelize(deleteUc.name)}`); optionalFields.push(`  final ${deleteUc.name}? _${camelize(deleteUc.name)};`); }
      const ctorParams = [...requiredParams, ...(optionalParams.length ? [`[${optionalParams.join(", ")}]`] : [])].join(", ");
      const requiredField = listUseCase ? `  final ${listUseCase.name} _${camelize(listUseCase.name)};` : "";

      return `class ${name}Cubit extends Cubit<${stateClass}> {
${[requiredField, ...optionalFields].filter(Boolean).join("\n")}
  ${name}Cubit(${ctorParams}) : super(const ${stateClass}());

  Future<void> load() async {
    emit(state.copyWith(status: ${statusEnum}.loading));
    try {
      // [user] region:user — replace with real repository call.
      ${listUseCase
        ? `final items = await _${camelize(listUseCase.name)}.call(${ucParamExpr});
      emit(state.copyWith(status: ${statusEnum}.success, ${collection}: items));`
        : `// Deterministic demo data so the app renders rows out of the box:
      emit(state.copyWith(status: ${statusEnum}.success, ${collection}: [${demoRows}]));`}
    } catch (e) {
      emit(state.copyWith(status: ${statusEnum}.failure, errorMessage: e.toString()));
    }
  }${crudMethods((expr) => `emit(state.copyWith(${collection}: ${expr}));`, true)}
}`;
    })();

  const stateLib = sm === "riverpod" ? "flutter_riverpod" : "flutter_bloc";
  const template = sm === "riverpod" ? "state_notifier.v1" : "state_enum_status.v1";

  return `// [generated] generator=StateGenerator template=${template} class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:${stateLib}/${stateLib}.dart';
${imports}

${stateBlock}

${container}
`;
}
