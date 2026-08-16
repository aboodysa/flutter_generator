// [generated] generator=AuthSessionGenerator template=session.v1 class=structural ownership=generated
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
  Persona(name: 'Sara Ahmed', role: 'employee', actorId: 'user-1', tenantId: 'acme'),
  Persona(name: 'Khalid Aziz', role: 'manager', actorId: 'user-2', tenantId: 'globex'),
  Persona(name: 'Rana Yousef', role: 'finance', actorId: 'user-3', tenantId: 'acme'),
];
