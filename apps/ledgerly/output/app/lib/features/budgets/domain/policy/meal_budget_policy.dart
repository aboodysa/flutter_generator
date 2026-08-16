// [generated] generator=PolicyEngineGenerator template=policy_engine.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';
import 'package:rasheed_replica_ledgerly/core/policy.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/rules/budget_committed_warn.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/rules/budget_committed_block.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/rules/budget_actual_justify.dart';

/// L2: every severity'd rule declared for MealBudget, evaluated in full (never first-match).
List<PolicyVerdict> evaluateMealBudgetPolicy(MealBudget e) {
  final verdicts = <PolicyVerdict>[];
  if (BudgetCommittedWarn().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'BudgetCommittedWarn',
      severity: PolicySeverity.warn,
      message: 'Committed spend for this category is high — review before approving more expenses.',
    ));
  }
  if (BudgetCommittedBlock().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'BudgetCommittedBlock',
      severity: PolicySeverity.block,
      message: 'Committed spend has reached the category cap — no further commitments allowed.',
    ));
  }
  if (BudgetActualJustify().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'BudgetActualJustify',
      severity: PolicySeverity.requireJustification,
      message: 'Actual spend in this category requires justification before period close.',
    ));
  }
  return verdicts;
}
