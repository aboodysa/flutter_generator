// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/personal_data.ui.json
// Product spec: specs/product/screens/personal_data.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../app/app_action_dispatcher.dart';
import '../../design_system/design_system.dart';

class PersonalDataScreen extends StatelessWidget {
  const PersonalDataScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'البيانات الشخصية', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppTextField(label: 'الاسم الكامل', placeholder: 'أحمد محمد'),
                  AppPhoneField(label: 'رقم الهاتف', placeholder: '+966 59 877 7733'),
                  AppTextField(label: 'البريد الإلكتروني', placeholder: 'ahmed@example.com')
          ],
        ),
      footer:
        FixedActionBar(
          buttonLabel: 'حفظ',
          onPressed: () => AppActionDispatcher.dispatch(
    context,
    screenId: 'personal_data',
    actionId: 'saveData',
  ),
        ),
      scroll: true,
    );
  }
}
