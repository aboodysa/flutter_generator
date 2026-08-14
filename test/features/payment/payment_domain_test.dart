import 'package:fahs/features/payment/data/models/confirm_payment_request_model.dart';
import 'package:fahs/features/payment/data/repositories/payment_repository_impl.dart';
import 'package:fahs/features/payment/domain/use_cases/confirm_payment_use_case.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('ConfirmPaymentUseCase returns submitted fake order', () async {
    final repository = PaymentRepositoryImpl();
    final useCase = ConfirmPaymentUseCase(repository);

    final order = await useCase.execute(
      const ConfirmPaymentRequest(
        inspectionId: 'inspection-1',
        paymentMethod: 'mada',
      ),
    );

    expect(order.id.startsWith('ORD-'), isTrue);
    expect(order.status, 'submitted');
    expect(order.totalAmount, 120.0);
    expect(order.createdAt, isNotNull);
  });
}
