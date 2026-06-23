// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/country_select.ui.json
// Product spec: specs/product/screens/country_select.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../app/app_action_dispatcher.dart';
import '../../design_system/design_system.dart';

class CountrySelectScreen extends StatelessWidget {
  const CountrySelectScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'اختر الدولة', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppSelectField(label: 'اختر الدولة', placeholder: 'المملكة العربية السعودية', options: ['[object Object]', '[object Object]', '[object Object]', '[object Object]', '[object Object]', '[object Object]'])
          ],
        ),
      footer:
        Column(
          spacing: AppSpacing.sm,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppButton.primary(
                    'تسجيل عملاء التطبيق',
                    onPressed: () => AppActionDispatcher.dispatch(
    context,
    screenId: 'country_select',
    actionId: 'registerCustomer',
    fallbackRouteName: 'phone_input',
  ),
                  ),
                  AppButton.outline('تسجيل مقدمي الخدمات')
          ],
        ),
      scroll: true,
    );
  }
}
