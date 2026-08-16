// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim.dart';

abstract interface class ExpenseClaimRepository {
  Future<List<ExpenseClaim>> listExpenseClaims();
  Future<ExpenseClaim> createExpenseClaim(ExpenseClaim claim);
  Future<void> updateExpenseClaim(ExpenseClaim claim);
  Future<void> deleteExpenseClaim(String id);
}
