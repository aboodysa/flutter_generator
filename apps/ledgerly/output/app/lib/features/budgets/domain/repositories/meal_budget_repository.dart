// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';

abstract interface class MealBudgetRepository {
  Future<List<MealBudget>> listMealBudgets();
  Future<MealBudget> createMealBudget(MealBudget budget);
  Future<void> updateMealBudget(MealBudget budget);
  Future<void> deleteMealBudget(String id);
}
