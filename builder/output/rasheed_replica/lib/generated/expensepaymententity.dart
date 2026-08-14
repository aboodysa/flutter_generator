// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class ExpensePaymentEntity extends Equatable {
  const ExpensePaymentEntity({
    required this.paymentType,
    required this.paidAmount,
  });

  final String paymentType;
  final double paidAmount;

  @override
  List<Object?> get props => [paymentType, paidAmount];
}
