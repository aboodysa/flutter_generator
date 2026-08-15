import { FeatureModel } from "../types";
import { PkgContext, kebab } from "../dart";
import { ArchitectureDecision } from "../arch";
import { screenPath } from "../routing";
import { crudFormTargets, crudFormScreenName } from "../operations";

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

  const screenRoutes = screens.map((s) => `      GoRoute(path: '${screenPath(screens, s)}', builder: (_, __) => const ${s.name}()),`);

  // Create/edit form routes (§5.2-F1) — one entity may get up to two: /<entity>/new (create) and
  // /<entity>/:id/edit (edit). Both point at the same synthesized `${Entity}FormScreen` (see
  // crud_form.ts), which branches on the presence of the `id` path param.
  const formTargets = [...crudFormTargets(feature).values()];
  const formRoutes = formTargets.map((t) => {
    const base = `/${kebab(t.entity)}`;
    const name = crudFormScreenName(t.entity);
    return [
      `      GoRoute(path: '${base}/new', builder: (_, __) => const ${name}()),`,
      `      GoRoute(path: '${base}/:id/edit', builder: (_, __) => const ${name}()),`,
    ].join("\n");
  });

  // Form routes first: `/task/new` (static) must be registered before `/task/:id` (detail,
  // dynamic) so go_router matches the literal segment rather than capturing "new" as an :id.
  const routes = [...formRoutes, ...screenRoutes].join("\n");

  const names = [...screens.map((s) => s.name), ...formTargets.map((t) => crudFormScreenName(t.entity))];
  const imports = names
    .map((n) => (ctx?.symbols.get(n) ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(n)}';` : `import '${n.toLowerCase()}.dart';`))
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
