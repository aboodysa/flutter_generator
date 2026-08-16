// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: ExecutiveExpenseBlock
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim.dart';


class ExecutiveExpenseBlock {
  bool evaluate(ExpenseClaim e) {
    return e.amount.minorUnits >= 1500000;
  }
}
