// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: isLargeExpense
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction.dart';

class isLargeExpense {
  bool evaluate(Transaction e) {
    return e.amount >= 1000;
  }
}
