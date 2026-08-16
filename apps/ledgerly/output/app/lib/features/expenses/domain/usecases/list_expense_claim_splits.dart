// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/repositories/expense_claim_split_repository.dart';
import 'package:rasheed_replica_ledgerly/core/no_params.dart';

class ListExpenseClaimSplits {
  final ExpenseClaimSplitRepository repository;
  const ListExpenseClaimSplits(this.repository);

  Future<List<ExpenseClaimSplit>> call(NoParams params) => repository.listExpenseClaimSplits();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
