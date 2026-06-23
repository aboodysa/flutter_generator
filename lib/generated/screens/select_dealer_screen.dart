// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/select_dealer.ui.json
// Product spec: specs/product/screens/select_dealer.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class SelectDealerScreen extends StatelessWidget {
  const SelectDealerScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'نقل ملكية مركبة', showBack: true),
      body:
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
                          child: Text('معرض الخليج للسيارات', style: AppTextStyles.title, textAlign: TextAlign.start),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: Text('الرياض - حي العزيزية', style: AppTextStyles.caption, textAlign: TextAlign.start),
                        ),
                      ],
                    ),
                  )
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
