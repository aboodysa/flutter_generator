// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/payment.ui.json
// Product spec: specs/product/screens/payment.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../design_system/design_system.dart';

class PaymentScreen extends StatelessWidget {
  const PaymentScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'فحص المركبة', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  SummaryBanner(title: 'مركز الفاحص بالقادسية', subtitle: 'تويوتا كورولا ٢٠٢٤، فحص شامل', price: '٥٠ ريال'),
                  AppPhoneField(label: 'رقم صاحب السيارة', placeholder: '+0598777733'),
                  AppTextField(label: 'كود الخصم', placeholder: 'ادخل كود الخصم',
                    prefix: const Icon(Icons.local_offer_outlined, size: 16, color: AppColors.textMuted),
                    suffix: Text('تفعيل', style: AppTextStyles.label.copyWith(color: AppColors.primary))),
                  PaymentMethodList(
                    label: 'طرق الدفع',
                    methods: [
                      PaymentMethodOption(id: 'card', label: 'دفع إلكتروني فيزا - ماستر', icon: 'card'),
                      PaymentMethodOption(id: 'mada', label: 'مدى mada', icon: 'mada'),
                      PaymentMethodOption(id: 'wallet', label: 'المحفظة', balance: '١٢٥ ر.س'),
                      PaymentMethodOption(id: 'tamara', label: 'قسمها على ٤ دفعات بـ ٣٣.٣ ر.س', icon: 'tamara')
                    ],
                  )
          ],
        ),
      footer:
        FixedActionBar(
          buttonLabel: 'تأكيد الطلب',
          onPressed: () => context.goNamed('order_details'),
        ),
      scroll: true,
    );
  }
}
