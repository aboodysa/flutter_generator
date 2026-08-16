// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/repositories/expense_claim_split_repository.dart';

class DeleteExpenseClaimSplit {
  final ExpenseClaimSplitRepository repository;
  const DeleteExpenseClaimSplit(this.repository);

  Future<void> call(String params) => repository.deleteExpenseClaimSplit(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
