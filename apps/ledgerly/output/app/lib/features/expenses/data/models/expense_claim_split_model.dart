// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim_split.dart';

class ExpenseClaimSplitModel {
  const ExpenseClaimSplitModel({
    required this.id,
    required this.expenseClaimId,
    required this.category,
    required this.percent,
  });

  final String id;
  final String expenseClaimId;
  final String category;
  final double percent;

  factory ExpenseClaimSplitModel.fromJson(Map<String, dynamic> json) => ExpenseClaimSplitModel(
      id: json['id'] as String,
      expenseClaimId: json['expenseClaimId'] as String,
      category: json['category'] as String,
      percent: (json['percent'] as num).toDouble(),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'expenseClaimId': expenseClaimId,
      'category': category,
      'percent': percent,
  };

  ExpenseClaimSplit toEntity() => ExpenseClaimSplit(
    id: id,
    expenseClaimId: expenseClaimId,
    category: category,
    percent: percent,
  );

  factory ExpenseClaimSplitModel.fromEntity(ExpenseClaimSplit e) => ExpenseClaimSplitModel(
    id: e.id,
    expenseClaimId: e.expenseClaimId,
    category: e.category,
    percent: e.percent,
  );
}
