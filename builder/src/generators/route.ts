import { FeatureModel } from "../types";
import { GenContext } from "../dart";
import { ScoringDecision } from "../scoring";

/**
 * RouteGenerator — structural, deterministic, 0% LLM.
 * Emits go_router routes from the screens declared in the IR.
 * Honors the §5.2 `none` branch: below the complexity floor, emits no router.
 */
export function generateRoutes(feature: FeatureModel, ctx?: GenContext, decision?: ScoringDecision): string {
  if (decision?.routing === "none") {
    return `// [generated] generator=RouteGenerator template=route_none.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Vanilla (none) strategy — no router needed for a minimal app.
`;
  }

  const routes = (feature.screens ?? [])
    .map((s) => {
      const path = "/" + s.name.replace(/Screen$/, "").replace(/([a-z0-9])([A-Z])/g, "$1-$2").toLowerCase();
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
