// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class ExpenseClaimSplit extends Equatable {
  const ExpenseClaimSplit({
    required this.id,
    required this.expenseClaimId,
    required this.category,
    required this.percent,
  });

  final String id;
  final String expenseClaimId;
  final String category;
  final double percent;

  @override
  List<Object?> get props => [id];
}
