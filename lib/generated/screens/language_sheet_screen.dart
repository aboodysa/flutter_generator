// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/language_sheet.ui.json
// Product spec: specs/product/screens/language_sheet.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../app/app_action_dispatcher.dart';
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
            AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('العربية', style: AppTextStyles.title, textAlign: TextAlign.start))),
            AppCard(child: Align(alignment: AlignmentDirectional.centerStart, child: Text('English', style: AppTextStyles.title, textAlign: TextAlign.start))),
            AppButton.primary(
              'حفظ',
              onPressed: () => AppActionDispatcher.dispatch(
    context,
    screenId: 'language_sheet',
    actionId: 'saveLanguage',
  ),
            )
          ],
        ),
      footer: null,
      scroll: false,
    );
  }
}
