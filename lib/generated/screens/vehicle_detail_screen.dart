// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/vehicle_detail.ui.json
// Product spec: specs/product/screens/vehicle_detail.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class VehicleDetailScreen extends StatelessWidget {
  const VehicleDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'تويوتا برادو تي اكس ٢٠٢٤', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  Row(
                    spacing: AppSpacing.md,
                    children: [
                      Expanded(
                        child:
                        AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('', style: AppTextStyles.title, textAlign: TextAlign.start))),
                      )
                    ],
                  ),
                  GridView.count(
                    crossAxisCount: 2,
                    mainAxisSpacing: AppSpacing.sm,
                    crossAxisSpacing: AppSpacing.sm,
                    shrinkWrap: true,
                    physics: const NeverScrollableScrollPhysics(),
                    childAspectRatio: 2.8,
                    children: [
                            AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('الماركة', style: AppTextStyles.title, textAlign: TextAlign.start))),
                            AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('الموديل', style: AppTextStyles.title, textAlign: TextAlign.start))),
                            AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('السنة', style: AppTextStyles.title, textAlign: TextAlign.start))),
                            AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('عداد المسافات', style: AppTextStyles.title, textAlign: TextAlign.start)))
                    ],
                  ),
                  Column(
                    spacing: AppSpacing.md,
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                            AppCard(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.stretch,
                                children: [
                                  Align(
                                    alignment: AlignmentDirectional.centerStart,
                                    child: Text('مركز الفاحص بالقادسية', style: AppTextStyles.title, textAlign: TextAlign.start),
                                  ),
                                  const SizedBox(height: AppSpacing.xs),
                                  Align(
                                    alignment: AlignmentDirectional.centerStart,
                                    child: Text('+966 59 877 7733', style: AppTextStyles.caption, textAlign: TextAlign.start),
                                  ),
                                ],
                              ),
                            )
                    ],
                  )
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
