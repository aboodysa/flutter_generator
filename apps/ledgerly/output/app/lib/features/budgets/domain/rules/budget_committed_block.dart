// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: BudgetCommittedBlock
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';


class BudgetCommittedBlock {
  bool evaluate(MealBudget e) {
    return e.committed.minorUnits >= 80000;
  }
}
