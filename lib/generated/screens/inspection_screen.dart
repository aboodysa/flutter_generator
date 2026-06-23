// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/inspection.ui.json
// Product spec: specs/product/screens/inspection.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../app/app_action_dispatcher.dart';
import '../../design_system/design_system.dart';

class InspectionScreen extends StatelessWidget {
  const InspectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'فحص المركبة', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppChipGroup(items: ['سيارة', 'دراجة نارية', 'شاحنة', 'معدات ثقيلة'], activeIndex: 0),
                  AppChipGroup(items: ['فحص شامل', 'فحص أساسي'], activeIndex: 0),
                  GridView.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: AppSpacing.sm,
                    crossAxisSpacing: AppSpacing.sm,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 2.8,
                    children: [
                            AppTextField(label: 'الماركة', placeholder: ''),
                            AppTextField(label: 'الموديل', placeholder: ''),
                            AppTextField(label: 'السنة', placeholder: '')
                    ],
                  )
          ],
        ),
      footer:
        FixedActionBar(
          buttonLabel: 'التالي',
          onPressed: () => AppActionDispatcher.dispatch(
    context,
    screenId: 'inspection',
    actionId: 'next',
    fallbackRouteName: 'service_centers',
  ),
        ),
      scroll: true,
    );
  }
}
