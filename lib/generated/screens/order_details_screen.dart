// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/order_details.ui.json
// Product spec: specs/product/screens/order_details.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../app/app_action_dispatcher.dart';
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
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: Text('تم تأكيد الطلب بنجاح', style: AppTextStyles.title, textAlign: TextAlign.start),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: Text('تم إرسال طلب الفحص إلى مركز الخدمة', style: AppTextStyles.caption, textAlign: TextAlign.start),
                        ),
                      ],
                    ),
                  ),
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: Text('رقم الطلب: #٢٠٢٤٠٦١٥', style: AppTextStyles.title, textAlign: TextAlign.start),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: Text('فحص شامل - تويوتا كورولا ٢٠٢٤', style: AppTextStyles.caption, textAlign: TextAlign.start),
                        ),
                      ],
                    ),
                  ),
                  AppCard(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.stretch,
                      children: [
                        Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: Text('مركز الفاحص بالقادسية', style: AppTextStyles.title, textAlign: TextAlign.start),
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Align(
                          alignment: AlignmentDirectional.centerStart,
                          child: Text('الرياض - حي القادسية', style: AppTextStyles.caption, textAlign: TextAlign.start),
                        ),
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
                          onPressed: () => AppActionDispatcher.dispatch(
    context,
    screenId: 'order_details',
    actionId: 'trackInspection',
    fallbackRouteName: 'track_inspection',
  ),
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
