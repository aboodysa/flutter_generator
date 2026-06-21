// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/manifest.json
// Generator: tools/generate_router.ts

import 'package:go_router/go_router.dart';
import '../screens/splash_screen.dart';
import '../screens/phone_input_screen.dart';
import '../screens/home_screen.dart';
import '../screens/payment_screen.dart';

final generatedAppRouter = GoRouter(
  initialLocation: '/splash',
  routes: [
    GoRoute(
      path: '/splash',
      name: 'splash',
      builder: (context, state) => const SplashScreen(),
    ),
    GoRoute(
      path: '/auth/phone',
      name: 'phone_input',
      builder: (context, state) => const PhoneInputScreen(),
    ),
    GoRoute(
      path: '/home',
      name: 'home',
      builder: (context, state) => const HomeScreen(),
    ),
    GoRoute(
      path: '/payment',
      name: 'payment',
      builder: (context, state) => const PaymentScreen(),
    ),
  ],
);
