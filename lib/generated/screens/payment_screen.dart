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
                  AppTextField(label: 'كود الخصم', placeholder: 'ادخل كود الخصم'),
                  Column(
                    crossAxisAlignment: CrossAxisAlignment.end,
                    children: [
                      Text('طرق الدفع', style: AppTextStyles.label),
                      const SizedBox(height: 8),
                          Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(color: AppColors.line),
              ),
              child: Row(
                children: [
                  Container(
                    width: 20, height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.line, width: 2),
                    ),
                    child: null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text('دفع إلكتروني فيزا - ماستر', style: AppTextStyles.bodyRegular, textAlign: TextAlign.right)),
                  
                ],
              ),
            ),
                          Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(color: AppColors.line),
              ),
              child: Row(
                children: [
                  Container(
                    width: 20, height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.line, width: 2),
                    ),
                    child: null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text('مدى mada', style: AppTextStyles.bodyRegular, textAlign: TextAlign.right)),
                  
                ],
              ),
            ),
                          Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(color: AppColors.line),
              ),
              child: Row(
                children: [
                  Container(
                    width: 20, height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.primary, width: 2),
                    ),
                    child: const Center(child: Icon(Icons.circle, size: 12, color: AppColors.primary)),
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text('المحفظة', style: AppTextStyles.bodyRegular, textAlign: TextAlign.right)),
                  
                  const SizedBox(width: 8),
                  StatusBadge.purple('١٢٥ ر.س'),
                ],
              ),
            ),
                          Container(
              padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
              decoration: BoxDecoration(
                color: AppColors.surface,
                borderRadius: BorderRadius.circular(AppRadius.sm),
                border: Border.all(color: AppColors.line),
              ),
              child: Row(
                children: [
                  Container(
                    width: 20, height: 20,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      border: Border.all(color: AppColors.line, width: 2),
                    ),
                    child: null,
                  ),
                  const SizedBox(width: 12),
                  Expanded(child: Text('قسمها على ٤ دفعات بـ ٣٣.٣ ر.س', style: AppTextStyles.bodyRegular, textAlign: TextAlign.right)),
                  
                ],
              ),
            ),
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
