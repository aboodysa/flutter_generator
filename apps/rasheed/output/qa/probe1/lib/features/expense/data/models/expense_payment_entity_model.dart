// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense/features/expense/domain/entities/expense_payment_entity.dart';
import 'package:rasheed_replica_expense/core/money.dart';

class ExpensePaymentEntityModel {
  const ExpensePaymentEntityModel({
    required this.paymentType,
    required this.paidAmount,
  });

  final String paymentType;
  final Money paidAmount;

  factory ExpensePaymentEntityModel.fromJson(Map<String, dynamic> json) => ExpensePaymentEntityModel(
      paymentType: json['paymentType'] as String,
      paidAmount: Money.fromJson(json['paidAmount'] as Map<String, dynamic>),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'paymentType': paymentType,
      'paidAmount': paidAmount.toJson(),
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
