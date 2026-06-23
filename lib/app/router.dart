import 'package:flutter/foundation.dart';
import 'package:go_router/go_router.dart';

import '../generated/app/router.g.dart';
import 'debug_screen_picker.dart';

final appRouter = GoRouter(
  initialLocation: kDebugMode ? '/debug/screens' : generatedInitialLocation,
  routes: [
    GoRoute(
      path: '/debug/screens',
      name: 'debug_screens',
      builder: (context, state) => const DebugScreenPicker(),
    ),
    ...generatedRoutes,
  ],
);
