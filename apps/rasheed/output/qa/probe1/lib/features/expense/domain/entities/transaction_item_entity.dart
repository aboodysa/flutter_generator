// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_expense/core/money.dart';

class TransactionItemEntity extends Equatable {
  const TransactionItemEntity({
    required this.id,
    required this.transactionEntityId,
    required this.name,
    required this.quantity,
    required this.totalPrice,
    required this.unitPrice,
    required this.disc,
    required this.vat,
  });

  final String id;
  final String transactionEntityId;
  final String name;
  final double quantity;
  final Money totalPrice;
  final Money unitPrice;
  final Money disc;
  final Money vat;

  @override
  List<Object?> get props => [id];
}
