// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/service_centers.ui.json
// Product spec: specs/product/screens/service_centers.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class ServiceCentersScreen extends StatelessWidget {
  const ServiceCentersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'مراكز الخدمة', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  ServiceCard(title: 'مركز الفاحص بالقادسية', subtitle: 'الرياض - حي القادسية', price: '٥٠ ريال')
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
