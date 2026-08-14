// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/expense_payment.dart';

class ExpensePaymentModel {
  const ExpensePaymentModel({
    required this.paymentType,
    required this.paidAmount,
  });

  final String paymentType;
  final double paidAmount;

  factory ExpensePaymentModel.fromJson(Map<String, dynamic> json) => ExpensePaymentModel(
      paymentType: json['paymentType'] as String,
      paidAmount: (json['paidAmount'] as num).toDouble(),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'paymentType': paymentType,
      'paidAmount': paidAmount,
  };

  ExpensePayment toEntity() => ExpensePayment(
    paymentType: paymentType,
    paidAmount: paidAmount,
  );

  factory ExpensePaymentModel.fromEntity(ExpensePayment e) => ExpensePaymentModel(
    paymentType: e.paymentType,
    paidAmount: e.paidAmount,
  );
}
