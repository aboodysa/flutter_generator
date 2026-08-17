// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/presentation/screens/transaction_list_screen.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/presentation/screens/transaction_form_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/transaction',
  routes: [
      GoRoute(path: '/transaction/new', builder: (_, __) => const TransactionFormScreen()),
      GoRoute(path: '/transaction/:id/edit', builder: (_, __) => const TransactionFormScreen()),
      GoRoute(path: '/transaction', builder: (_, __) => const TransactionListScreen()),
  ],
);
