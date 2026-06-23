// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/inspection_saved.ui.json
// Product spec: specs/product/screens/inspection_saved.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../app/app_action_dispatcher.dart';
import '../../design_system/design_system.dart';

class InspectionSavedScreen extends StatelessWidget {
  const InspectionSavedScreen({super.key});

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
                  AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('تويوتا كورولا ٢٠٢٤', style: AppTextStyles.title, textAlign: TextAlign.start))),
                  VehiclePlate(label: '', placeholder: '', value: ''),
                  AppChipGroup(items: ['فحص شامل'], activeIndex: 0),
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
          buttonLabel: 'متابعة',
          onPressed: () => AppActionDispatcher.dispatch(
    context,
    screenId: 'inspection_saved',
    actionId: 'proceed',
    fallbackRouteName: 'service_centers',
  ),
        ),
      scroll: true,
    );
  }
}
