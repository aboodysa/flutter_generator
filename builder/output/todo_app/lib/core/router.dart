// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/presentation/screens/task_list_screen.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/presentation/screens/task_detail_screen.dart';

final appRouter = GoRouter(
  routes: [
      GoRoute(path: '/task-list', builder: (_, __) => const TaskListScreen()),
      GoRoute(path: '/task-detail', builder: (_, __) => const TaskDetailScreen()),
  ],
);
