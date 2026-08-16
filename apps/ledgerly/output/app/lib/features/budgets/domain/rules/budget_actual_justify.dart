// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: BudgetActualJustify
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';


class BudgetActualJustify {
  bool evaluate(MealBudget e) {
    return e.actual.minorUnits >= 40000;
  }
}
