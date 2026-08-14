import 'package:fahs/features/orders/domain/entities/order.dart';
import 'package:fahs/features/payment/data/models/confirm_payment_request_model.dart';

abstract class PaymentRepository {
  Future<Order> confirmPayment(ConfirmPaymentRequest request);
}
