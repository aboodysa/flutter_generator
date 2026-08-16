// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/repositories/expense_claim_repository.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/claim_status.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim.dart';
import 'package:rasheed_replica_ledgerly/core/money.dart';

class ExpenseClaimRepositoryInMemoryImpl implements ExpenseClaimRepository {
  final List<ExpenseClaim> _items = [ExpenseClaim(id: 'x', name: 'Sample ExpenseClaim', amount: Money(minorUnits: 0, currency: 'SAR'), status: ClaimStatus.values.first), ExpenseClaim(id: 'expense-claim-1', name: 'Sample ExpenseClaim 1', amount: Money(minorUnits: 15000, currency: 'SAR'), status: ClaimStatus.values.first), ExpenseClaim(id: 'expense-claim-2', name: 'Sample ExpenseClaim 2', amount: Money(minorUnits: 25000, currency: 'SAR'), status: ClaimStatus.values.first)];

  @override
  Future<List<ExpenseClaim>> listExpenseClaims() async => List.unmodifiable(_items);

  @override
  Future<ExpenseClaim> createExpenseClaim(ExpenseClaim claim) async {
    _items.add(claim);
    return claim;
  }

  @override
  Future<void> updateExpenseClaim(ExpenseClaim claim) async {
    final idx = _items.indexWhere((e) => e.id == claim.id);
    if (idx != -1) _items[idx] = claim;
  }

  @override
  Future<void> deleteExpenseClaim(String id) async {
    _items.removeWhere((e) => e.id == id);
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
