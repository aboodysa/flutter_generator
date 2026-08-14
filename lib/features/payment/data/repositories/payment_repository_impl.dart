import 'package:fahs/features/orders/domain/entities/order.dart';
import 'package:fahs/features/payment/data/models/confirm_payment_request_model.dart';
import 'package:fahs/features/payment/domain/repositories/payment_repository.dart';

class PaymentRepositoryImpl implements PaymentRepository {
  @override
  Future<Order> confirmPayment(ConfirmPaymentRequest request) async {
    // Fake implementation for current repo migration.
    // Replace with API client after the Payment Pilot is verified.
    await Future<void>.delayed(const Duration(milliseconds: 300));

    return Order(
      id: 'ORD-${DateTime.now().millisecondsSinceEpoch}',
      status: 'submitted',
      totalAmount: 120.0,
      createdAt: DateTime.now(),
    );
  }
}
