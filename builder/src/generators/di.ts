import { FeatureModel } from "../types";
import { GenContext } from "../dart";
import { ArchitectureDecision } from "../arch";

/**
 * DIGenerator — structural, deterministic, 0% LLM.
 * Emits a get_it service locator from the dependency graph (datasources → repos → use cases → cubits).
 * Honors the arch layer's `di` decision: `none`/`provider_scope` (riverpod) → no get_it container.
 */
export function generateDi(feature: FeatureModel, ctx?: GenContext, decision?: ArchitectureDecision): string {
  if (decision?.di !== "get_it") {
    const reason = decision?.di === "provider_scope" ? "riverpod ProviderScope is the DI container" : "vanilla (none) strategy — no DI container needed";
    return `// [generated] generator=DIGenerator template=di_${decision?.di ?? "none"}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// ${reason}.
void setupDependencies() {}
`;
  }

  const lines: string[] = ["final sl = GetIt.instance;", "", "void setupDependencies() {"];

  for (const d of feature.datasources ?? []) {
    lines.push(`  sl.registerLazySingleton<${d.name}>(() => ${d.name}(sl<Dio>()));`);
  }
  // Repository impls: declared impl, else an auto-generated in-memory impl (demo data).
  for (const repo of feature.repositories ?? []) {
    const declared = (feature.repositoryImpls ?? []).find((ri) => ri.contract === repo.name);
    const impl = declared ? declared.name : `${repo.name}InMemoryImpl`;
    lines.push(`  sl.registerLazySingleton<${repo.name}>(() => ${impl}());`);
  }
  for (const u of feature.useCases ?? []) {
    lines.push(`  sl.registerLazySingleton<${u.name}>(() => ${u.name}(sl<${u.repository}>()));`);
  }
  for (const s of feature.states ?? []) {
    const uc = (feature.useCases ?? []).find((u) => u.returnType === `List<${s.entity}>`);
    lines.push(uc
      ? `  sl.registerFactory<${s.name}Cubit>(() => ${s.name}Cubit(sl<${uc.name}>()));`
      : `  sl.registerFactory<${s.name}Cubit>(() => ${s.name}Cubit());`);
  }
  lines.push("}");

  const implNames = (feature.repositories ?? []).map((repo) => {
    const declared = (feature.repositoryImpls ?? []).find((ri) => ri.contract === repo.name);
    return declared ? declared.name : `${repo.name}InMemoryImpl`;
  });
  const stateUseCases = (feature.states ?? []).map((s) => (feature.useCases ?? []).find((u) => u.returnType === `List<${s.entity}>`)?.name).filter((n): n is string => !!n);
  const names = Array.from(new Set([
    ...(feature.datasources ?? []).map((d) => d.name),
    ...implNames,
    ...(feature.repositories ?? []).map((r) => r.name),
    ...(feature.useCases ?? []).flatMap((u) => [u.name, u.repository]),
    ...(feature.states ?? []).map((s) => s.name),
    ...stateUseCases,
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
