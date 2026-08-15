// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/screens/task_list_screen.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/screens/task_detail_screen.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/screens/follow_up_list_screen.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/screens/follow_up_detail_screen.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/screens/task_form_screen.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/screens/follow_up_form_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/task',
  routes: [
      GoRoute(path: '/task/new', builder: (_, __) => const TaskFormScreen()),
      GoRoute(path: '/task/:id/edit', builder: (_, __) => const TaskFormScreen()),
      GoRoute(path: '/follow-up/new', builder: (_, __) => const FollowUpFormScreen()),
      GoRoute(path: '/follow-up/:id/edit', builder: (_, __) => const FollowUpFormScreen()),
      GoRoute(path: '/task', builder: (_, __) => const TaskListScreen()),
      GoRoute(path: '/task/:id', builder: (_, __) => const TaskDetailScreen()),
      GoRoute(path: '/follow-up', builder: (_, __) => const FollowUpListScreen()),
      GoRoute(path: '/follow-up/:id', builder: (_, __) => const FollowUpDetailScreen()),
  ],
);
