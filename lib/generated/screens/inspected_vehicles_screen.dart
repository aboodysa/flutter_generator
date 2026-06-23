// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/inspected_vehicles.ui.json
// Product spec: specs/product/screens/inspected_vehicles.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class InspectedVehiclesScreen extends StatelessWidget {
  const InspectedVehiclesScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'آخر مركبات تم فحصها', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  VehicleCard(title: 'تويوتا كورولا ٢٠٢٤', subtitle: '', plate: 'ABC 1234', status: 'مكتمل')
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
