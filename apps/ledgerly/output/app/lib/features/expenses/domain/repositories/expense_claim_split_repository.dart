// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim_split.dart';

abstract interface class ExpenseClaimSplitRepository {
  Future<List<ExpenseClaimSplit>> listExpenseClaimSplits();
  Future<ExpenseClaimSplit> createExpenseClaimSplit(ExpenseClaimSplit split);
  Future<void> updateExpenseClaimSplit(ExpenseClaimSplit split);
  Future<void> deleteExpenseClaimSplit(String id);
}
