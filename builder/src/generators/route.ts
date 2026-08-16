import { FeatureModel } from "../types";
import { PkgContext, kebab } from "../dart";
import { ArchitectureDecision } from "../arch";
import { screenPath } from "../routing";
import { crudFormTargets, crudFormScreenName, hasAuth, authOf, authRoles, hasAudit } from "../operations";

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
 *
 * MF2 (auth): when the IR declares `attributes.auth`, this emits the role-guarded variant —
 * a `/login` route + `guardPath()` redirect. `kHomeRoutes` maps each role to its home entity's
 * list path (auth.home — the source of truth the login screen's onTap navigation and every
 * allowed/denied decision read), and `kAllowedRoutes` lists each role's additional reachable
 * entity prefixes (auth.allow). guardPath() returns:
 *   - null  → the navigation is allowed,
 *   - a path → navigate there instead (redirect to /login when unauthenticated, to the role's
 *     own home when the target is outside its home/allow area, home when an authed user lands
 *     on /login).
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

  // L3: the audit log is app-level (not tied to any entity's own screen), so it's a bespoke static
  // route the same way `/login` is below — no collision risk (fully static, no dynamic segment).
  const auditRoute = hasAudit(feature) ? [`      GoRoute(path: '/audit-log', builder: (_, __) => const AuditLogScreen()),`] : [];

  // Form routes first: `/task/new` (static) must be registered before `/task/:id` (detail,
  // dynamic) so go_router matches the literal segment rather than capturing "new" as an :id.
  const routes = [...formRoutes, ...screenRoutes, ...auditRoute].join("\n");

  const names = [...screens.map((s) => s.name), ...formTargets.map((t) => crudFormScreenName(t.entity)), ...(hasAuth(feature) ? ["AuthLoginScreen"] : []), ...(hasAudit(feature) ? ["AuditLogScreen"] : [])];
  const imports = names
    .map((n) => (ctx?.symbols.get(n) ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(n)}';` : `import '${n.toLowerCase()}.dart';`))
    .join("\n");

  // The app's home route — main.dart mounts MaterialApp.router with no other start-screen
  // signal, so this must resolve. Convention: the first declared screen (matches generateMain
  // / generateGoldenTest, which both take feature.screens[0] as "the" screen).
  const firstScreen = screens[0];
  const initialLocation = firstScreen ? screenPath(screens, firstScreen) : "/";

  if (hasAuth(feature)) {
    const auth = authOf(feature)!;
    const homeRoutes = authRoles(feature)
      .filter((r) => auth.home?.[r])
      .map((r) => `  '${r}': '/${kebab(auth.home[r]!)}',`)
      .join("\n");
    // Emit only roles that declare extra reachable entities (an absent/empty entry means "home
    // area only" — the default deny posture every role starts from).
    const allowedRoles = authRoles(feature).filter((r) => (auth.allow?.[r] ?? []).length);
    const allowedRoutes = allowedRoles.length
      ? allowedRoles
          .map((r) => `  '${r}': [${auth.allow![r]!.map((e) => `'/${kebab(e)}'`).join(", ")}],`)
          .join("\n")
      : "";
    const allowedBlock = allowedRoutes ? `const kAllowedRoutes = <String, List<String>>{\n${allowedRoutes}\n};\n\n` : `const kAllowedRoutes = <String, List<String>>{};\n\n`;

    return `// [generated] generator=RouteGenerator template=route_auth.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:${ctx!.pkg}/core/session.dart';
${imports}

final kHomeRoutes = <String, String>{
${homeRoutes}
};

${allowedBlock}String? guardPath(String path) {
  final p = path.startsWith('/') ? path : '/$path';
  if (p == '/login') {
    return Session.instance.isAuthenticated ? (kHomeRoutes[Session.instance.role] ?? null) : null;
  }
  if (!Session.instance.isAuthenticated) return '/login';
  final home = kHomeRoutes[Session.instance.role];
  final allowed = kAllowedRoutes[Session.instance.role] ?? const <String>[];
  final prefixes = [if (home != null) home, ...allowed];
  for (final start in prefixes) {
    if (p == start || p.startsWith('$start/')) return null;
  }
  return home ?? '/login';
}

final appRouter = GoRouter(
  initialLocation: '/login',
  redirect: (context, state) => guardPath(state.uri.path),
  routes: [
      GoRoute(path: '/login', builder: (_, __) => const AuthLoginScreen()),
${routes}
  ],
);
`;
  }

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
