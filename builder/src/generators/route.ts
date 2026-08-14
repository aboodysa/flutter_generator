import { FeatureModel } from "../types";
import { GenContext } from "../dart";
import { ArchitectureDecision } from "../arch";

/**
 * RouteGenerator — structural, deterministic, 0% LLM.
 * Emits go_router routes from the screens declared in the IR.
 * Honors the arch layer's `routing` decision: `none` → no router.
 */
export function generateRoutes(feature: FeatureModel, ctx?: GenContext, decision?: ArchitectureDecision): string {
  if (decision?.routing === "none") {
    return `// [generated] generator=RouteGenerator template=route_none.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Vanilla (none) strategy — no router needed for a minimal app.
`;
  }

  const routes = (feature.screens ?? [])
    .map((s) => {
      // list = the app root; detail = a param'd route the list navigates to.
      const path = s.type === "detail" ? "/detail/:id" : "/";
      return `      GoRoute(path: '${path}', builder: (_, __) => const ${s.name}()),`;
    })
    .join("\n");

  const imports = (feature.screens ?? [])
    .map((s) => (ctx?.symbols.get(s.name) ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(s.name)}';` : `import '${s.name.toLowerCase()}.dart';`))
    .join("\n");

  return `// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
${imports}

final appRouter = GoRouter(
  routes: [
${routes}
  ],
);
`;
}
