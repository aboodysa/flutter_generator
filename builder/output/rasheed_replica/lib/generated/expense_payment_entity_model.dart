// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'expense_payment_entity.dart';

class ExpensePaymentEntityModel {
  const ExpensePaymentEntityModel({
    required this.paymentType,
    required this.paidAmount,
  });

  final String paymentType;
  final double paidAmount;

  factory ExpensePaymentEntityModel.fromJson(Map<String, dynamic> json) => ExpensePaymentEntityModel(
      paymentType: json['paymentType'] as String,
      paidAmount: (json['paidAmount'] as num).toDouble(),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'paymentType': paymentType,
      'paidAmount': paidAmount,
  };

  ExpensePaymentEntity toEntity() => ExpensePaymentEntity(
    paymentType: paymentType,
    paidAmount: paidAmount,
  );

  factory ExpensePaymentEntityModel.fromEntity(ExpensePaymentEntity e) => ExpensePaymentEntityModel(
    paymentType: e.paymentType,
    paidAmount: e.paidAmount,
  );
}
