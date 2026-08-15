import { StateModel, StateField } from "../types";
import { importsFromTypes, variantSampleArgs, GenContext } from "../dart";

const DEFAULT_STATUSES = ["initial", "loading", "success", "failure"];

// The three built-in fields every list state has.
function builtinFields(entity: string): StateField[] {
  return [
    { name: "status", type: "STATUS", default: "initial" },
    { name: "transactions", type: `List<${entity}>`, default: "const []" },
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
 * IR StateModel → enum Status + state class + Cubit.
 */
export function generateState(s: StateModel, ctx?: GenContext): string {
  const name = s.name;
  const entity = s.entity;
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

  const entityModel = (ctx?.ir?.entities ?? []).find((e: any) => e.name === entity);
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

  // Container differs by provider (arch layer): bloc = Cubit, riverpod = Notifier + provider.
  const container = sm === "riverpod"
    ? `final ${camelize(name)}Provider = NotifierProvider<${name}Notifier, ${stateClass}>(${name}Notifier.new);

class ${name}Notifier extends Notifier<${stateClass}> {
  @override
  ${stateClass} build() => ${stateClass}(
    status: ${statusEnum}.success,
    transactions: [${demoRows}],
  );

  Future<void> load() async {
    state = state.copyWith(status: ${statusEnum}.loading);
    try {
      // [user] region:user — replace with real repository call.
      state = state.copyWith(status: ${statusEnum}.success, transactions: [${demoRows}]);
    } catch (e) {
      state = state.copyWith(status: ${statusEnum}.failure, errorMessage: e.toString());
    }
  }
}`
    : `class ${name}Cubit extends Cubit<${stateClass}> {
  ${listUseCase ? `final ${listUseCase.name} _${camelize(listUseCase.name)};` : ""}
  ${name}Cubit(${listUseCase ? `this._${camelize(listUseCase.name)}` : ""}) : super(const ${stateClass}());

  Future<void> load() async {
    emit(state.copyWith(status: ${statusEnum}.loading));
    try {
      // [user] region:user — replace with real repository call.
      ${listUseCase
        ? `final items = await _${camelize(listUseCase.name)}.call(${ucParamExpr});
      emit(state.copyWith(status: ${statusEnum}.success, transactions: items));`
        : `// Deterministic demo data so the app renders rows out of the box:
      emit(state.copyWith(status: ${statusEnum}.success, transactions: [${demoRows}]));`}
    } catch (e) {
      emit(state.copyWith(status: ${statusEnum}.failure, errorMessage: e.toString()));
    }
  }
}`;

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

function camelize(name: string): string {
  return name.charAt(0).toLowerCase() + name.slice(1);
}
