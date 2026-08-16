// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';
import 'package:rasheed_replica_ledgerly/core/money.dart';

class MealBudgetModel {
  const MealBudgetModel({
    required this.id,
    required this.name,
    required this.limit,
    required this.committed,
    required this.actual,
  });

  final String id;
  final String name;
  final Money limit;
  final Money committed;
  final Money actual;

  factory MealBudgetModel.fromJson(Map<String, dynamic> json) => MealBudgetModel(
      id: json['id'] as String,
      name: json['name'] as String,
      limit: Money.fromJson(json['limit'] as Map<String, dynamic>),
      committed: Money.fromJson(json['committed'] as Map<String, dynamic>),
      actual: Money.fromJson(json['actual'] as Map<String, dynamic>),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
      'limit': limit.toJson(),
      'committed': committed.toJson(),
      'actual': actual.toJson(),
  };

  MealBudget toEntity() => MealBudget(
    id: id,
    name: name,
    limit: limit,
    committed: committed,
    actual: actual,
  );

  factory MealBudgetModel.fromEntity(MealBudget e) => MealBudgetModel(
    id: e.id,
    name: e.name,
    limit: e.limit,
    committed: e.committed,
    actual: e.actual,
  );
}
