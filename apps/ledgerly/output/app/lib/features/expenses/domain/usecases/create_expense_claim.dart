// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/repositories/expense_claim_repository.dart';

class CreateExpenseClaim {
  final ExpenseClaimRepository repository;
  const CreateExpenseClaim(this.repository);

  Future<ExpenseClaim> call(ExpenseClaim params) => repository.createExpenseClaim(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
