import { FeatureModel } from "../types";
import { GenContext } from "../dart";
import { ScoringDecision } from "../scoring";

/**
 * DIGenerator — structural, deterministic, 0% LLM.
 * Emits a get_it service locator from the dependency graph (datasources → repos → use cases → cubits).
 * Honors the §5.2 `none` branch: below the complexity floor, emits no DI container.
 */
export function generateDi(feature: FeatureModel, ctx?: GenContext, decision?: ScoringDecision): string {
  if (decision?.di === "none") {
    return `// [generated] generator=DIGenerator template=di_none.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Vanilla (none) strategy — no DI container needed for a minimal app.
void setupDependencies() {}
`;
  }

  const lines: string[] = ["final sl = GetIt.instance;", "", "void setupDependencies() {"];

  for (const d of feature.datasources ?? []) {
    lines.push(`  sl.registerLazySingleton<${d.name}>(() => ${d.name}(sl<Dio>()));`);
  }
  for (const ri of feature.repositoryImpls ?? []) {
    lines.push(`  sl.registerLazySingleton<${ri.contract}>(() => ${ri.name}(sl<${ri.datasource}>()));`);
  }
  for (const u of feature.useCases ?? []) {
    lines.push(`  sl.registerLazySingleton<${u.name}>(() => ${u.name}(sl<${u.repository}>()));`);
  }
  for (const s of feature.states ?? []) {
    lines.push(`  sl.registerFactory<${s.name}Cubit>(() => ${s.name}Cubit());`);
  }
  lines.push("}");

  const names = Array.from(new Set([
    ...(feature.datasources ?? []).map((d) => d.name),
    ...(feature.repositoryImpls ?? []).flatMap((r) => [r.name, r.contract]),
    ...(feature.useCases ?? []).flatMap((u) => [u.name, u.repository]),
    ...(feature.states ?? []).map((s) => s.name), // state file also holds the cubit
  ]));
  const refs = names.map((n) => (ctx?.symbols.get(n) ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(n)}';` : `import '${n.toLowerCase()}.dart';`));
  const imports = [
    "import 'package:get_it/get_it.dart';",
    ...(feature.datasources?.length ? ["import 'package:dio/dio.dart';"] : []),
    ...refs,
  ].join("\n");

  return `// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
${imports}

${lines.join("\n")}
`;
}
