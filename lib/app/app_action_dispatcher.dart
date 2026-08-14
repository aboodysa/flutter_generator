import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:fahs/features/payment/data/models/confirm_payment_request_model.dart';
import 'package:fahs/features/payment/data/repositories/payment_repository_impl.dart';
import 'package:fahs/features/payment/domain/use_cases/confirm_payment_use_case.dart';

typedef AppActionHandler = Future<void> Function(BuildContext context);

class AppActionDispatcher {
  AppActionDispatcher._();

  static final Map<String, AppActionHandler> _handlers = {
    'phone_input.continue': _phoneInputContinue,
    'otp_verification.resend': _otpResend,
    'add_balance.submit': _addBalanceSubmit,
    'payment.confirmOrder': _paymentConfirmOrder,
  };

  static Future<void> dispatch(
    BuildContext context, {
    required String screenId,
    required String actionId,
    String? fallbackRouteName,
  }) async {
    final key = '$screenId.$actionId';
    final handler = _handlers[key];

    if (handler != null) {
      await handler(context);
      return;
    }

    if (fallbackRouteName != null && fallbackRouteName.isNotEmpty) {
      context.goNamed(fallbackRouteName);
      return;
    }

    debugPrint('No handler or fallback route for generated action: $key');
  }

  static Future<void> _phoneInputContinue(BuildContext context) async {
    context.goNamed('otp_verification');
  }

  static Future<void> _otpResend(BuildContext context) async {
    // Intentionally empty until resend OTP API is connected.
  }

  static Future<void> _addBalanceSubmit(BuildContext context) async {
    context.goNamed('payment');
  }

  static Future<void> _paymentConfirmOrder(BuildContext context) async {
    final repository = PaymentRepositoryImpl();
    final useCase = ConfirmPaymentUseCase(repository);

    await useCase.execute(
      const ConfirmPaymentRequest(
        inspectionId: 'inspection-current-repo-pilot',
        paymentMethod: 'mada',
      ),
    );

    if (!context.mounted) {
      return;
    }

    context.goNamed('order_details');
  }
}
