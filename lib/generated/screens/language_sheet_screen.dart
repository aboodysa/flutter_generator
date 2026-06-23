// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/language_sheet.ui.json
// Product spec: specs/product/screens/language_sheet.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class LanguageSheetScreen extends StatelessWidget {
  const LanguageSheetScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'الملف الشخصي', showBack: true),
      body:
        AppBottomSheet(
          children: [
            AppCard(child: Text('العربية', style: AppTextStyles.title, textAlign: TextAlign.right)),
            AppCard(child: Text('English', style: AppTextStyles.title, textAlign: TextAlign.right)),
            AppButton.primary(
              'حفظ',
              onPressed: () {},
            )
          ],
        ),
      footer: null,
      scroll: false,
    );
  }
}
