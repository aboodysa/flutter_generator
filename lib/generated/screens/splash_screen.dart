// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/splash.ui.json
// Product spec: specs/product/screens/splash.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class SplashScreen extends StatelessWidget {
  const SplashScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header: null,
      body:
        Column(
          spacing: AppSpacing.lg,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  const SplashHero()
          ],
        ),
      footer: null,
      scroll: false,
    );
  }
}
