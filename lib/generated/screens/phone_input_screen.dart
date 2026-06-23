// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/phone_input.ui.json
// Product spec: specs/product/screens/phone_input.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../app/app_action_dispatcher.dart';
import '../../design_system/design_system.dart';

class PhoneInputScreen extends StatelessWidget {
  const PhoneInputScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: '', showBack: true),
      body:
        Column(
          spacing: AppSpacing.lg,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  Text('رقم الهاتف', style: AppTextStyles.heading, textAlign: TextAlign.start),
                  Text('سوف نرسل ٤ أرقام لهاتفك المحمول للتأكد', style: AppTextStyles.bodyRegular.copyWith(color: AppColors.textMuted, height: 1.5), textAlign: TextAlign.start),
                  AppPhoneField(label: '', placeholder: '051234321'),
                  AppButton.primary(
                    'متابعة',
                    onPressed: () => AppActionDispatcher.dispatch(
    context,
    screenId: 'phone_input',
    actionId: 'continue',
    fallbackRouteName: 'otp_verification',
  ),
                  )
          ],
        ),
      footer: null,
      scroll: false,
    );
  }
}
