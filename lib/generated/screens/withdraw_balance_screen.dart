// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/withdraw_balance.ui.json
// Product spec: specs/product/screens/withdraw_balance.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class WithdrawBalanceScreen extends StatelessWidget {
  const WithdrawBalanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'سحب رصيد', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppTextField(label: 'اسم البنك', placeholder: 'البنك الأهلي السعودي'),
                  AppTextField(label: 'رقم الحساب', placeholder: 'SA0000000000000000'),
                  AppTextField(label: 'رقم الآيبان', placeholder: 'SA0000000000000000000000'),
                  AppTextField(label: 'اسم صاحب الحساب', placeholder: ''),
                  AmountField(label: 'المبلغ', placeholder: 'أدخل المبلغ', currency: 'ريال'),
                  AppBanner(title: 'تنبيه', subtitle: 'سيتم خصم المبلغ من رصيد محفظتك')
          ],
        ),
      footer:
        FixedActionBar(
          buttonLabel: 'سحب',
          onPressed: () {},
        ),
      scroll: true,
    );
  }
}
