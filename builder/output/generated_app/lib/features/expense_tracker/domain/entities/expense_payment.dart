// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_expense_tracker/core/money.dart';

class ExpensePayment extends Equatable {
  const ExpensePayment({
    required this.paymentType,
    required this.paidAmount,
  });

  final String paymentType;
  final Money paidAmount;

  @override
  List<Object?> get props => [paymentType, paidAmount];
}
