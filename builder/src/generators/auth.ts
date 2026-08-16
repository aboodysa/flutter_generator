import { FeatureModel } from "../types";
import { GenContext } from "../dart";
import { authPersonas, hasLocale } from "../operations";

/**
 * AuthSessionGenerator — structural, deterministic, 0% LLM.
 * Emits the app-level auth/session core files (lib/core/):
 *   - session.dart     — the in-memory Session singleton + Persona model + the demo persona list
 *                        (kPersonas) the login screen renders and the routers/repos read.
 *   - auth_login_screen.dart — the demo login screen (one AppListCard per persona). Tapping a
 *                        persona signs the session in and navigates to that role's home route
 *                        (kHomeRoutes, emitted by RouteGenerator — see route.ts's auth branch).
 *
 * Nothing here does network/persistence: personas are deterministic demo accounts derived from
 * the IR (operations.ts authPersonas — explicit `auth.personas` win, else one per role).
 */

function personasLiteral(ir: FeatureModel): string {
  const personas = authPersonas(ir);
  if (!personas.length) return "  Persona(name: 'Demo', role: 'demo', actorId: 'user-0', tenantId: 'acme'),";
  return personas.map((p) => `  Persona(name: '${p.name}', role: '${p.role}', actorId: '${p.actorId}', tenantId: '${p.tenantId}'),`).join("\n");
}

export function generateSession(ir: FeatureModel): string {
  return `// [generated] generator=AuthSessionGenerator template=session.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
// MF2: in-memory offline session — the app's auth boundary for this iteration. No network/no
// persistence: personas are demo accounts, and the router guard (route.ts) + tenant-scoped
// repositories (repository_impl.ts) read this singleton on every route change / data access.

class Persona {
  const Persona({required this.name, required this.role, required this.actorId, required this.tenantId});
  final String name;
  final String role;
  final String actorId;
  final String tenantId;
}

class Session {
  Session._();
  static final Session instance = Session._();

  String? _role;
  String? _actorId;
  String? _tenantId;
  String? _displayName;

  bool get isAuthenticated => _role != null;
  String? get role => _role;
  String? get actorId => _actorId;
  String? get tenantId => _tenantId;
  String? get displayName => _displayName;

  void signIn({required String role, required String actorId, required String tenantId, String? displayName}) {
    _role = role;
    _actorId = actorId;
    _tenantId = tenantId;
    _displayName = displayName;
  }

  void signOut() {
    _role = null;
    _actorId = null;
    _tenantId = null;
    _displayName = null;
  }
}

/// The demo accounts shown on the generated login screen (IR auth.personas, or one derived per
/// role) — the seed identities tenant-scoped repositories source their session stamps from.
const kPersonas = <Persona>[
${personasLiteral(ir)}
];
`;
}

export function generateAuthLoginScreen(ir: FeatureModel, ctx?: GenContext): string {
  const componentsImport = ctx ? `import 'package:${ctx.pkg}/core/components.dart';` : "import '../core/components.dart';";
  const themeImport = ctx ? `import 'package:${ctx.pkg}/core/theme.dart';` : "import '../core/theme.dart';";
  const sessionImport = ctx ? `import 'package:${ctx.pkg}/core/session.dart';` : "import 'session.dart';";
  const routerImport = ctx ? `import 'package:${ctx.pkg}/core/router.dart';` : "import 'router.dart';";
  // G-L4-2: route the two login-screen literals through AppStrings for locale-aware apps only —
  // byte-identical output for non-locale apps (mirrors crud_form.ts's saveLabel/AppStrings
  // gating). Without this, an AR/RTL session still showed "Sign in"/"Choose a demo account" in
  // English — the only screen L4's own AppStrings rollout missed.
  const locale = hasLocale(ir);
  const appStringsImport = locale ? (ctx ? `import 'package:${ctx.pkg}/core/app_strings.dart';\n` : "import 'app_strings.dart';\n") : "";
  const signInTitle = locale ? "Text(AppStrings.of(context).signIn)" : "const Text('Sign in')";
  const chooseAccountText = locale ? "Text(AppStrings.of(context).chooseDemoAccount, style: const TextStyle(fontWeight: FontWeight.w600))" : "const Text('Choose a demo account', style: TextStyle(fontWeight: FontWeight.w600))";

  return `// [generated] generator=AuthLoginGenerator template=auth_login.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
${componentsImport}
${themeImport}
${sessionImport}
${routerImport}
${appStringsImport}
/// Demo login — one tappable AppListCard per persona (kPersonas from session.dart). Tapping
/// signs the session in and navigates to that role's home route (kHomeRoutes from router.dart).
class AuthLoginScreen extends StatelessWidget {
  const AuthLoginScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: ${signInTitle}),
      body: ListView(
        padding: const EdgeInsets.all(AppSpacing.md),
        children: [
          ${chooseAccountText},
          const SizedBox(height: AppSpacing.sm),
          for (final p in kPersonas)
            Padding(
              padding: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: AppListCard(
                card: true,
                leading: AppAvatar(label: p.name),
                title: Text(p.name),
                subtitle: Text('\${p.role} · \${p.tenantId}'),
                trailing: const Icon(Icons.chevron_right),
                onTap: () {
                  Session.instance.signIn(role: p.role, actorId: p.actorId, tenantId: p.tenantId, displayName: p.name);
                  context.go(kHomeRoutes[p.role] ?? '/');
                },
              ),
            ),
        ],
      ),
    );
  }
}
`;
}