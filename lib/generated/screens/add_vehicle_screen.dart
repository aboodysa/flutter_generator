// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/add_vehicle.ui.json
// Product spec: specs/product/screens/add_vehicle.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../app/app_action_dispatcher.dart';
import '../../design_system/design_system.dart';

class AddVehicleScreen extends StatelessWidget {
  const AddVehicleScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'مركباتي', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
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
          buttonLabel: 'حفظ',
          onPressed: () => AppActionDispatcher.dispatch(
    context,
    screenId: 'add_vehicle',
    actionId: 'saveVehicle',
  ),
        ),
      scroll: true,
    );
  }
}
