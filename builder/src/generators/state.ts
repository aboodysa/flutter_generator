import { StateModel, StateField, EntityModel, ScreenModel, WizardStep } from "../types";
import { importsFromTypes, variantSampleArgs, sampleArgFor, collectionField, camelize, capitalize, fieldDartType, GenContext } from "../dart";
import { crudOperations, findRepoForEntity, findWizardScreen } from "../operations";

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
  // P8-W2: a wizard-bound state is shaped completely differently (step index + per-step draft
  // fields, not a loaded collection) — a dedicated generator keeps the CRUD/list path above
  // untouched (zero regression risk) instead of threading a third shape through it.
  const wizardScreen = ctx?.ir ? findWizardScreen(ctx.ir, s.name) : undefined;
  if (wizardScreen) return generateWizardState(s, wizardScreen, ctx);

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

/**
 * Wizard state generator (P8-W2) — step-index state + one nullable field per step that collects
 * an entity field + next()/back()/jumpTo()/finish() + a `canAdvance` getter gating the current
 * step: a `validate` step evaluates its RuleModel (§19) against a `_draft` entity built from the
 * fields collected so far (type-correct placeholders — sampleArgFor — for anything not yet
 * visited, so the rule always runs against a real, constructible instance); a plain `field` step
 * requires it non-null/non-empty; a step with neither always advances (info/confirm step).
 */
function generateWizardState(s: StateModel, wizardScreen: ScreenModel, ctx?: GenContext): string {
  const name = s.name;
  const entity = s.entity;
  const statuses = s.statuses ?? DEFAULT_STATUSES;
  const statusEnum = `${name}Status`;
  const stateClass = `${name}State`;
  const sm = ctx?.sm ?? "bloc";
  const steps: WizardStep[] = wizardScreen.steps ?? [];

  const entityModel = (ctx?.ir?.entities ?? []).find((e: any) => e.name === entity) as EntityModel | undefined;
  const enums = ctx?.ir?.enums ?? [];
  const valueObjects = ctx?.ir?.valueObjects ?? [];
  const fieldDef = (fieldName: string) => entityModel?.fields.find((f) => f.name === fieldName);

  // One nullable state field per step that collects an entity field (not yet filled = null).
  const stepFieldNames = Array.from(new Set(steps.map((st) => st.field).filter((f): f is string => !!f)));
  const stepStateFields: StateField[] = stepFieldNames.map((fname) => {
    const f = fieldDef(fname);
    return { name: fname, type: `${f ? fieldDartType(f) : "String"}?`, default: undefined };
  });

  const fields: StateField[] = [
    { name: "status", type: "STATUS", default: "initial" },
    { name: "currentStep", type: "int", default: "0" },
    ...stepStateFields,
    { name: "errorMessage", type: "String?", default: undefined },
  ];

  const fieldDecl = (f: StateField) => `  final ${f.type === "STATUS" ? statusEnum : f.type} ${f.name};`;
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
  // Nullable fields default to "reset unless explicitly passed" (matches errorMessage's intent:
  // clear on any transition). Step-collected draft fields (name/email/...) need the opposite —
  // next()/back()/finish() don't repass them, so they must MERGE (preserve) or every transition
  // would silently wipe the answers collected so far.
  const copyWithAssign = (f: StateField) => {
    if (!f.type.endsWith("?")) return `    ${f.name}: ${f.name} ?? this.${f.name},`;
    if (stepFieldNames.includes(f.name)) return `    ${f.name}: ${f.name} ?? this.${f.name},`;
    return `    ${f.name}: ${f.name},`;
  };

  // _draft: a full entity from whatever's been filled + a type-correct placeholder (sampleArgFor)
  // for every other field, so `validate` rules always run against a real, constructible instance.
  const needsDraft = steps.some((st) => st.validate);
  const draftArgs = (entityModel?.fields ?? [])
    .map((f) => (stepFieldNames.includes(f.name)
      ? `      ${f.name}: ${f.name} ?? ${sampleArgFor(f, enums, valueObjects)},`
      : `      ${f.name}: ${sampleArgFor(f, enums, valueObjects)},`))
    .join("\n");
  const draftGetter = needsDraft && entityModel ? `\n  ${entity} get _draft => ${entity}(\n${draftArgs}\n      );\n` : "";

  const stepGuard = (st: WizardStep): string => {
    if (st.validate) {
      const fieldCheck = st.field ? `${st.field} != null && ` : "";
      return `${fieldCheck}${st.validate}().evaluate(_draft)`;
    }
    if (st.field) {
      const f = fieldDef(st.field);
      return f?.type === "String" ? `(${st.field} != null && ${st.field}!.isNotEmpty)` : `${st.field} != null`;
    }
    return "true";
  };
  const canAdvanceGetter = `
  bool get canAdvance => switch (currentStep) {
${steps.map((st, i) => `      ${i} => ${stepGuard(st)},`).join("\n")}
      _ => true,
    };
`;

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
${draftGetter}${canAdvanceGetter}
  @override
  List<Object?> get props => [${fields.map((f) => f.name).join(", ")}];
}`;

  const setterMethods = (assign: (expr: string) => string): string => stepFieldNames.map((fname) => {
    const f = fieldDef(fname);
    return `  void set${capitalize(fname)}(${f ? fieldDartType(f) : "String"}? value) => ${assign(`${fname}: value`)};`;
  }).join("\n\n");

  const flowMethods = (assign: (expr: string) => string): string => `
  // No-op: a wizard has nothing to fetch, but main.dart/test.ts's bloc bootstrap
  // unconditionally calls \`sl<XCubit>()..load()\` for every screen's state.
  Future<void> load() async {}

  void next() {
    if (!state.canAdvance) return;
    if (state.currentStep < ${Math.max(steps.length - 1, 0)}) ${assign(`currentStep: state.currentStep + 1`)};
  }

  void back() {
    if (state.currentStep > 0) ${assign(`currentStep: state.currentStep - 1`)};
  }

  void jumpTo(int i) {
    if (i >= 0 && i < ${steps.length}) ${assign("currentStep: i")};
  }

  void finish() {
    if (!state.canAdvance) return;
    ${assign(`status: ${statusEnum}.success`)};
  }

${setterMethods(assign)}`;

  const blocAssign = (expr: string) => `emit(state.copyWith(${expr}))`;
  const riverpodAssign = (expr: string) => `state = state.copyWith(${expr})`;

  const container = sm === "riverpod"
    ? `final ${camelize(name)}Provider = NotifierProvider<${name}Notifier, ${stateClass}>(${name}Notifier.new);

class ${name}Notifier extends Notifier<${stateClass}> {
  @override
  ${stateClass} build() => const ${stateClass}();
${flowMethods(riverpodAssign)}
}`
    : `class ${name}Cubit extends Cubit<${stateClass}> {
  ${name}Cubit() : super(const ${stateClass}());
${flowMethods(blocAssign)}
}`;

  const refTypes: string[] = [entity];
  for (const fname of stepFieldNames) {
    const f = fieldDef(fname);
    if (f?.semanticType) refTypes.push(f.semanticType);
    else if (f?.type === "enum") refTypes.push(f.of || capitalize(f.name));
  }
  for (const st of steps) if (st.validate) refTypes.push(st.validate);
  const imports = importsFromTypes(refTypes, ctx).join("\n");

  const stateLib = sm === "riverpod" ? "flutter_riverpod" : "flutter_bloc";
  const template = sm === "riverpod" ? "state_wizard_notifier.v1" : "state_wizard.v1";

  return `// [generated] generator=StateGenerator template=${template} class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:${stateLib}/${stateLib}.dart';
${imports}

${stateBlock}

${container}
`;
}
