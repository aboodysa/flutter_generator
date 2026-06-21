// GENERATED CODE - DO NOT MODIFY BY HAND.
// Generated from: specs/ui/screens/phone_input.ui.json
// Product spec: specs/product/screens/phone_input.product.json
// Generator: tools/generate_flutter.ts

import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
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
                  AppTopBar(title: 'رقم الهاتف', showBack: false),
                  AppTopBar(title: 'سوف نرسل ٤ أرقام لهاتفك المحمول للتأكد', showBack: false),
                  AppPhoneField(label: '', placeholder: '051234321'),
                  AppButton.primary(
                    'متابعة',
                    onPressed: () => context.goNamed('otp_verification'),
                  )
          ],
        ),
      footer: null,
      scroll: false,
    );
  }
}
