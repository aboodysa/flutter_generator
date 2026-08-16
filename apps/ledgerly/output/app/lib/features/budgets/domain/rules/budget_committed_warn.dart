// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: BudgetCommittedWarn
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';


class BudgetCommittedWarn {
  bool evaluate(MealBudget e) {
    return e.committed.minorUnits >= 30000;
  }
}
