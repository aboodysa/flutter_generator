// [generated] generator=RouteGenerator template=route_go_router.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:go_router/go_router.dart';
import 'package:rasheed_replica_keemart/features/keemart/presentation/screens/home_screen.dart';

final appRouter = GoRouter(
  initialLocation: '/product',
  routes: [
      GoRoute(path: '/product', builder: (_, __) => const HomeScreen()),
  ],
);
