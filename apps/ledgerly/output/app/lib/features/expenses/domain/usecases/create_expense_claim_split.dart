// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/repositories/expense_claim_split_repository.dart';

class CreateExpenseClaimSplit {
  final ExpenseClaimSplitRepository repository;
  const CreateExpenseClaimSplit(this.repository);

  Future<ExpenseClaimSplit> call(ExpenseClaimSplit params) => repository.createExpenseClaimSplit(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
