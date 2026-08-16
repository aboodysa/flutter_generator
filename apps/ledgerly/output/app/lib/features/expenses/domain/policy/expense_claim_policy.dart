// [generated] generator=PolicyEngineGenerator template=policy_engine.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim.dart';
import 'package:rasheed_replica_ledgerly/core/policy.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/rules/micro_expense_auto_approve.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/rules/standard_expense_warn.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/rules/large_expense_justify.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/rules/executive_expense_block.dart';

/// L2: every severity'd rule declared for ExpenseClaim, evaluated in full (never first-match).
List<PolicyVerdict> evaluateExpenseClaimPolicy(ExpenseClaim e) {
  final verdicts = <PolicyVerdict>[];
  if (MicroExpenseAutoApprove().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'MicroExpenseAutoApprove',
      severity: PolicySeverity.autoApprove,
      message: 'Expenses of 50 SAR or less are auto-approved without manager review.',
    ));
  }
  if (StandardExpenseWarn().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'StandardExpenseWarn',
      severity: PolicySeverity.warn,
      message: 'This expense is unusually large — please double-check the amount before submitting.',
    ));
  }
  if (LargeExpenseJustify().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'LargeExpenseJustify',
      severity: PolicySeverity.requireJustification,
      message: 'Expenses of 2,000 SAR or more require a written justification.',
    ));
  }
  if (ExecutiveExpenseBlock().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'ExecutiveExpenseBlock',
      severity: PolicySeverity.block,
      message: 'Expenses of 15,000 SAR or more require executive approval outside this system.',
    ));
  }
  return verdicts;
}
