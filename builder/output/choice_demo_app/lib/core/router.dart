// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/presentation/screens/pick_list_screen.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/presentation/screens/pick_wizard_screen.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/presentation/screens/pick_form_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/pick',
  routes: [
      GoRoute(path: '/pick/new', builder: (_, __) => const PickFormScreen()),
      GoRoute(path: '/pick/:id/edit', builder: (_, __) => const PickFormScreen()),
      GoRoute(path: '/pick', builder: (_, __) => const PickListScreen()),
      GoRoute(path: '/pick/wizard', builder: (_, __) => const PickWizardScreen()),
  ],
);
