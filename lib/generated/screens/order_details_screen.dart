// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/order_details.ui.json
// Product spec: specs/product/screens/order_details.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import '../../design_system/design_system.dart';

class OrderDetailsScreen extends StatelessWidget {
  const OrderDetailsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'تفاصيل الطلب', showBack: true),
      body:
        Column(
          spacing: AppSpacing.md,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('تم تأكيد الطلب بنجاح', style: AppTextStyles.title, textAlign: TextAlign.right),
                        const SizedBox(height: AppSpacing.xs),
                        Text('تم إرسال طلب الفحص إلى مركز الخدمة', style: AppTextStyles.caption, textAlign: TextAlign.right),
                      ],
                    ),
                  ),
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('رقم الطلب: #٢٠٢٤٠٦١٥', style: AppTextStyles.title, textAlign: TextAlign.right),
                        const SizedBox(height: AppSpacing.xs),
                        Text('فحص شامل - تويوتا كورولا ٢٠٢٤', style: AppTextStyles.caption, textAlign: TextAlign.right),
                      ],
                    ),
                  ),
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.end,
                      children: [
                        Text('مركز الفاحص بالقادسية', style: AppTextStyles.title, textAlign: TextAlign.right),
                        const SizedBox(height: AppSpacing.xs),
                        Text('الرياض - حي القادسية', style: AppTextStyles.caption, textAlign: TextAlign.right),
                      ],
                    ),
                  ),
                  Row(
                    spacing: AppSpacing.sm,
                    children: [
                      Expanded(
                        child:
                        AppButton.primary(
                          'تتبع الفحص',
                          onPressed: () => context.goNamed('track_inspection'),
                        ),
                      ),
                      Expanded(
                        child:
                        AppButton.outline('إلغاء الطلب'),
                      )
                    ],
                  )
          ],
        ),
      footer: null,
      scroll: true,
    );
  }
}
