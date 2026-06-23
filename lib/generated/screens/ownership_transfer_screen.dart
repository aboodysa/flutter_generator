// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/ownership_transfer.ui.json
// Product spec: specs/product/screens/ownership_transfer.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../app/app_action_dispatcher.dart';
import '../../design_system/design_system.dart';

class OwnershipTransferScreen extends StatelessWidget {
  const OwnershipTransferScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'نقل ملكية مركبة', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppBanner(title: 'نقل ملكية مركبة', subtitle: 'قم بإدخال بيانات المركبة لنقل الملكية'),
                  AppChipGroup(items: ['خصوصي', 'دراجة نارية', 'شاحنة', 'معدات ثقيلة'], activeIndex: 0),
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
                  ),
                  VehiclePlate(label: 'رقم اللوحة', placeholder: 'أدخل رقم اللوحة', value: '')
          ],
        ),
      footer:
        FixedActionBar(
          buttonLabel: 'التالي',
          onPressed: () => AppActionDispatcher.dispatch(
    context,
    screenId: 'ownership_transfer',
    actionId: 'next',
    fallbackRouteName: 'select_dealer',
  ),
        ),
      scroll: true,
    );
  }
}
