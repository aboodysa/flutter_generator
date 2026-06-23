// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/final_report.ui.json
// Product spec: specs/product/screens/final_report.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class FinalReportScreen extends StatelessWidget {
  const FinalReportScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'التقرير النهائي', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('تقرير فحص المركبة', style: AppTextStyles.title, textAlign: TextAlign.right),
                        const SizedBox(height: AppSpacing.xs),
                        Text('تويوتا كورولا ٢٠٢٤', style: AppTextStyles.caption, textAlign: TextAlign.right),
                      ],
                    ),
                  )
          ],
        ),
      footer:
        Row(
          spacing: AppSpacing.sm,
          children: [
            Expanded(
              child:
              AppButton.primary(
                'مشاهدة',
                onPressed: () {},
              ),
            ),
            Expanded(
              child:
              AppButton.outline('تحميل'),
            )
          ],
        ),
      scroll: false,
    );
  }
}
