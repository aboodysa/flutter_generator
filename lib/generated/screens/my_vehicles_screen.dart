// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/my_vehicles.ui.json
// Product spec: specs/product/screens/my_vehicles.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../design_system/design_system.dart';

class MyVehiclesScreen extends StatelessWidget {
  const MyVehiclesScreen({super.key});

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
                  VehicleCard(title: 'تويوتا كورولا ٢٠٢٤', subtitle: '', plate: 'ABC 1234', status: '')
          ],
        ),
      footer:
        FixedActionBar(
          buttonLabel: 'إضافة مركبة',
          onPressed: () => context.goNamed('add_vehicle'),
        ),
      scroll: true,
    );
  }
}
