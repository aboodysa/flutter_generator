// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/leave_request_list_screen.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/leave_request_detail_screen.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/approval_list_screen.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/leave_request_form_screen.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/screens/approval_form_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/leave-request',
  routes: [
      GoRoute(path: '/leave-request/new', builder: (_, __) => const LeaveRequestFormScreen()),
      GoRoute(path: '/leave-request/:id/edit', builder: (_, __) => const LeaveRequestFormScreen()),
      GoRoute(path: '/approval/new', builder: (_, __) => const ApprovalFormScreen()),
      GoRoute(path: '/approval/:id/edit', builder: (_, __) => const ApprovalFormScreen()),
      GoRoute(path: '/leave-request', builder: (_, __) => const LeaveRequestListScreen()),
      GoRoute(path: '/leave-request/:id', builder: (_, __) => const LeaveRequestDetailScreen()),
      GoRoute(path: '/approval', builder: (_, __) => const ApprovalListScreen()),
  ],
);
