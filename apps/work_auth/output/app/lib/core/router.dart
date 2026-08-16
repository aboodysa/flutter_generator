// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/screens/work_auth_list_screen.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/screens/work_auth_wizard_screen.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/screens/work_auth_form_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/work-auth',
  routes: [
      GoRoute(path: '/work-auth/new', builder: (_, __) => const WorkAuthFormScreen()),
      GoRoute(path: '/work-auth/:id/edit', builder: (_, __) => const WorkAuthFormScreen()),
      GoRoute(path: '/work-auth', builder: (_, __) => const WorkAuthListScreen()),
      GoRoute(path: '/work-auth/wizard', builder: (_, __) => const WorkAuthWizardScreen()),
  ],
);
