import 'package:fahs/features/orders/domain/entities/order.dart';
import 'package:fahs/features/payment/data/models/confirm_payment_request_model.dart';
import 'package:fahs/features/payment/domain/repositories/payment_repository.dart';

class ConfirmPaymentUseCase {
  final PaymentRepository _repository;

  const ConfirmPaymentUseCase(this._repository);

  Future<Order> execute(ConfirmPaymentRequest request) {
    return _repository.confirmPayment(request);
  }
}
