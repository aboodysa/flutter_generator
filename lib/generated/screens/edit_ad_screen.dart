// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/edit_ad.ui.json
// Product spec: specs/product/screens/edit_ad.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class EditAdScreen extends StatelessWidget {
  const EditAdScreen({super.key});

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
                  AppCard(child: Text('', style: AppTextStyles.title, textAlign: TextAlign.right)),
                  AmountField(label: 'السعر', placeholder: '٨٥٠٠٠ ريال', currency: 'ريال'),
                  AppTextField(label: 'الوصف', placeholder: 'أدخل وصف السيارة'),
                  AppCard(child: Text('منشور', style: AppTextStyles.title, textAlign: TextAlign.right))
          ],
        ),
      footer:
        FixedActionBar(
          buttonLabel: 'حفظ',
          onPressed: () {},
        ),
      scroll: true,
    );
  }
}
