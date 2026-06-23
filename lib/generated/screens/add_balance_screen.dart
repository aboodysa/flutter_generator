// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/add_balance.ui.json
// Product spec: specs/product/screens/add_balance.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class AddBalanceScreen extends StatelessWidget {
  const AddBalanceScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'إضافة رصيد', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AmountField(label: 'المبلغ', placeholder: 'أدخل المبلغ', currency: 'ريال'),
                  PaymentMethodList(
                    label: 'طريقة الدفع',
                    methods: [
                      PaymentMethodOption(id: 'card', label: 'بطاقة ائتمان', icon: 'card'),
                      PaymentMethodOption(id: 'bank', label: 'تحويل بنكي', icon: 'bank'),
                      PaymentMethodOption(id: 'stcPay', label: 'STC Pay', icon: 'stc')
                    ],
                  )
          ],
        ),
      footer:
        FixedActionBar(
          buttonLabel: 'إضافة',
          onPressed: () {},
        ),
      scroll: true,
    );
  }
}
