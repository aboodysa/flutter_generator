// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/vehicle_photos.ui.json
// Product spec: specs/product/screens/vehicle_photos.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class VehiclePhotosScreen extends StatelessWidget {
  const VehiclePhotosScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'صور السيارة', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  PhotoGrid(label: '', count: 4),
                  AppBanner(title: 'تنبيه', subtitle: 'سيتم حذف الفيديو بعد ٧ أيام من تاريخ الفحص')
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
