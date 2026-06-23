// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/ownership_payment.ui.json
// Product spec: specs/product/screens/ownership_payment.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../design_system/design_system.dart';

class OwnershipPaymentScreen extends StatelessWidget {
  const OwnershipPaymentScreen({super.key});

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
                  SummaryBanner(title: 'معرض الخليج للسيارات', subtitle: 'نقل ملكية - تويوتا كورولا ٢٠٢٤', price: '١٥٠ ريال'),
                  AppPhoneField(label: 'رقم صاحب السيارة', placeholder: '+0598777733'),
                  AppTextField(label: 'كود الخصم', placeholder: 'ادخل كود الخصم',
                    prefix: const Icon(Icons.local_offer_outlined, size: 16, color: AppColors.textMuted),
                    suffix: Text('تفعيل', style: AppTextStyles.label.copyWith(color: AppColors.primary))),
                  PaymentMethodList(
                    label: 'طرق الدفع',
                    methods: [
                      PaymentMethodOption(id: 'card', label: 'دفع إلكتروني فيزا - ماستر', icon: 'card'),
                      PaymentMethodOption(id: 'mada', label: 'مدى mada', icon: 'mada'),
                      PaymentMethodOption(id: 'wallet', label: 'المحفظة', balance: '١٢٥ ر.س')
                    ],
                  )
          ],
        ),
      footer:
        FixedActionBar(
          buttonLabel: 'تأكيد',
          onPressed: () => context.goNamed('order_details'),
        ),
      scroll: true,
    );
  }
}
