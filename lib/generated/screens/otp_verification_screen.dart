// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/otp_verification.ui.json
// Product spec: specs/product/screens/otp_verification.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import '../../design_system/design_system.dart';

class OtpVerificationScreen extends StatelessWidget {
  const OtpVerificationScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return AppScaffold(
      header:
        AppTopBar(title: 'التحقق من رقم هاتفك', showBack: true),
      body:
        Column(
          spacing: AppSpacing.lg,
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
                  Text('أدخل رمز التحقق الذي تم إرساله إلى هاتفك', style: AppTextStyles.bodyRegular.copyWith(color: AppColors.textMuted, height: 1.5), textAlign: TextAlign.start),
                  OtpInput(length: 4),
                  AppButton.ghost('إعادة إرسال الرمز')
          ],
        ),
      footer: null,
      scroll: false,
    );
  }
}
