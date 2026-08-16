// [generated] generator=RouteGenerator template=route_auth.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_hr_service/core/session.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/leave_request_list_screen.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/leave_request_detail_screen.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/approval_list_screen.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/leave_request_form_screen.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/approval_form_screen.dart';
import 'package:rasheed_replica_hr_service/core/auth_login_screen.dart';
import 'package:rasheed_replica_hr_service/core/audit_log_screen.dart';

final kHomeRoutes = <String, String>{
  'employee': '/leave-request',
  'hr_admin': '/leave-request',
};

const kAllowedRoutes = <String, List<String>>{
  'employee': ['/leave-request', '/approval'],
  'hr_admin': ['/leave-request', '/approval', '/audit-log'],
};

String? guardPath(String path) {
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
      GoRoute(path: '/leave-request/new', builder: (_, __) => const LeaveRequestFormScreen()),
      GoRoute(path: '/leave-request/:id/edit', builder: (_, __) => const LeaveRequestFormScreen()),
      GoRoute(path: '/approval/new', builder: (_, __) => const ApprovalFormScreen()),
      GoRoute(path: '/approval/:id/edit', builder: (_, __) => const ApprovalFormScreen()),
      GoRoute(path: '/leave-request', builder: (_, __) => const LeaveRequestListScreen()),
      GoRoute(path: '/leave-request/:id', builder: (_, __) => const LeaveRequestDetailScreen()),
      GoRoute(path: '/approval', builder: (_, __) => const ApprovalListScreen()),
      GoRoute(path: '/audit-log', builder: (_, __) => const AuditLogScreen()),
  ],
);
