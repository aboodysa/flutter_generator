// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/repositories/meal_budget_repository.dart';

class UpdateMealBudget {
  final MealBudgetRepository repository;
  const UpdateMealBudget(this.repository);

  Future<void> call(MealBudget params) => repository.updateMealBudget(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
