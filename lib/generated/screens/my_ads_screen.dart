// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/my_ads.ui.json
// Product spec: specs/product/screens/my_ads.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class MyAdsScreen extends StatelessWidget {
  const MyAdsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'إعلاناتي', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppCard(child: Text('تويوتا كورولا ٢٠٢٤', style: AppTextStyles.title, textAlign: TextAlign.right))
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
