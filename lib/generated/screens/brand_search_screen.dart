// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/brand_search.ui.json
// Product spec: specs/product/screens/brand_search.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class BrandSearchScreen extends StatelessWidget {
  const BrandSearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'ابحث عن السيارات', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppSearchField(placeholder: 'ابحث عن الماركة'),
                  SpecList(
                    title: 'تويوتا',
                    items: [
                      SpecMenuItem(label: 'كورولا'),
                      SpecMenuItem(label: 'كامري'),
                      SpecMenuItem(label: 'برادو')
                    ],
                  )
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
