// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/my_orders.ui.json
// Product spec: specs/product/screens/my_orders.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class MyOrdersScreen extends StatelessWidget {
  const MyOrdersScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'طلباتي', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppSegmentedControl(items: [], activeIndex: 0),
                  OrderCard(
                    vehicleName: '',
                    date: '١٥ يونيو ٢٠٢٦',
                  )
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
