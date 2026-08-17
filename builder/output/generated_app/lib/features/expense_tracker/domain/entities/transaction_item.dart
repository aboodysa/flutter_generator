// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_expense_tracker/core/money.dart';

class TransactionItem extends Equatable {
  const TransactionItem({
    required this.id,
    required this.name,
    required this.quantity,
    required this.unitPrice,
  });

  final String id;
  final String name;
  final double quantity;
  final Money unitPrice;

  @override
  List<Object?> get props => [id];
}
