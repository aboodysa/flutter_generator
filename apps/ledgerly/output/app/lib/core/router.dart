// [generated] generator=RouteGenerator template=route_auth.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_ledgerly/core/session.dart';
import 'package:rasheed_replica_ledgerly/features/auth/presentation/screens/user_list_screen.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/screens/expense_claim_list_screen.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/screens/expense_claim_detail_screen.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/presentation/screens/approval_list_screen.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/presentation/screens/meal_budget_list_screen.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/presentation/screens/meal_budget_detail_screen.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/screens/expense_claim_form_screen.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/presentation/screens/meal_budget_form_screen.dart';
import 'package:rasheed_replica_ledgerly/core/auth_login_screen.dart';
import 'package:rasheed_replica_ledgerly/core/audit_log_screen.dart';

final kHomeRoutes = <String, String>{
  'employee': '/expense-claim',
  'manager': '/expense-claim',
  'finance': '/approval',
};

const kAllowedRoutes = <String, List<String>>{
  'employee': ['/expense-claim', '/approval', '/meal-budget'],
  'manager': ['/expense-claim', '/approval', '/meal-budget'],
  'finance': ['/expense-claim', '/approval', '/user', '/meal-budget', '/audit-log'],
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
      GoRoute(path: '/expense-claim/new', builder: (_, __) => const ExpenseClaimFormScreen()),
      GoRoute(path: '/expense-claim/:id/edit', builder: (_, __) => const ExpenseClaimFormScreen()),
      GoRoute(path: '/meal-budget/new', builder: (_, __) => const MealBudgetFormScreen()),
      GoRoute(path: '/meal-budget/:id/edit', builder: (_, __) => const MealBudgetFormScreen()),
      GoRoute(path: '/user', builder: (_, __) => const UserListScreen()),
      GoRoute(path: '/expense-claim', builder: (_, __) => const ExpenseClaimListScreen()),
      GoRoute(path: '/expense-claim/:id', builder: (_, __) => const ExpenseClaimDetailScreen()),
      GoRoute(path: '/approval', builder: (_, __) => const ApprovalListScreen()),
      GoRoute(path: '/meal-budget', builder: (_, __) => const MealBudgetListScreen()),
      GoRoute(path: '/meal-budget/:id', builder: (_, __) => const MealBudgetDetailScreen()),
      GoRoute(path: '/audit-log', builder: (_, __) => const AuditLogScreen()),
  ],
);
