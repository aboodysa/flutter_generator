import 'package:flutter/material.dart';
import 'router.dart';
export 'app_action_dispatcher.dart';

class FahsApp extends StatelessWidget {
  const FahsApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp.router(
      title: 'FAHS',
      routerConfig: appRouter,
      debugShowCheckedModeBanner: false,
      locale: const Locale('ar'),
      builder: (context, child) {
        return Directionality(
          textDirection: TextDirection.rtl,
          child: child ?? const SizedBox.shrink(),
        );
      },
    );
  }
}
