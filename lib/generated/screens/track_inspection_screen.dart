// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/track_inspection.ui.json
// Product spec: specs/product/screens/track_inspection.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class TrackInspectionScreen extends StatelessWidget {
  const TrackInspectionScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'تتبع الفحص', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  InspectionTimeline(
                    steps: [
                      TimelineStepData(label: 'تم استلام الطلب', completed: true),
                      TimelineStepData(label: 'جاري الفحص', completed: true),
                      TimelineStepData(label: 'رفع الصور', completed: false),
                      TimelineStepData(label: 'التقرير النهائي', completed: false)
                    ],
                  ),
                  PhotoGrid(label: 'صور الفحص', count: 4)
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
