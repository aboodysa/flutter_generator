import { FeatureModel } from "../types";
import { PkgContext } from "../dart";
import { ArchitectureDecision } from "../arch";
import { screenPath } from "../routing";

/**
 * RouteGenerator — structural, deterministic, 0% LLM.
 * Emits go_router routes from the screens declared in the IR.
 * Honors the arch layer's `routing` decision: `none` → no router.
 *
 * Path scheme (SOLID review #1 — `screenPath()` in routing.ts is the single source, also
 * consumed by screen.ts's onTap so the router and the navigation target never drift apart):
 *   list screen   -> /<kebab(entity)>
 *   detail screen -> /<kebab(entity)>/:id
 * (collision-disambiguated per screenPath's rule when two screens share a (type, entity) pair).
 */
export function generateRoutes(feature: FeatureModel, ctx?: PkgContext, decision?: ArchitectureDecision): string {
  if (decision?.routing === "none") {
    return `// [generated] generator=RouteGenerator template=route_none.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// Vanilla (none) strategy — no router needed for a minimal app.
`;
  }

  const screens = feature.screens ?? [];

  const routes = screens
    .map((s) => `      GoRoute(path: '${screenPath(screens, s)}', builder: (_, __) => const ${s.name}()),`)
    .join("\n");

  const imports = screens
    .map((s) => (ctx?.symbols.get(s.name) ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(s.name)}';` : `import '${s.name.toLowerCase()}.dart';`))
    .join("\n");

  // The app's home route — main.dart mounts MaterialApp.router with no other start-screen
  // signal, so this must resolve. Convention: the first declared screen (matches generateMain
  // / generateGoldenTest, which both take feature.screens[0] as "the" screen).
  const firstScreen = screens[0];
  const initialLocation = firstScreen ? screenPath(screens, firstScreen) : "/";

  return `// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
${imports}

final appRouter = GoRouter(
  initialLocation: '${initialLocation}',
  routes: [
${routes}
  ],
);
`;
}
