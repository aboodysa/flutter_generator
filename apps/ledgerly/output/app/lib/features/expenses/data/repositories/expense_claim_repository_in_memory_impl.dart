// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/repositories/expense_claim_repository.dart';
import 'package:rasheed_replica_ledgerly/core/audit.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/claim_status.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/data/models/expense_claim_model.dart';
import 'package:rasheed_replica_ledgerly/core/money.dart';
import 'package:rasheed_replica_ledgerly/core/outbox.dart';
import 'package:rasheed_replica_ledgerly/core/session.dart';

class ExpenseClaimRepositoryInMemoryImpl implements ExpenseClaimRepository {
  final List<ExpenseClaim> _items = [ExpenseClaim(id: 'x', name: 'Sample ExpenseClaim', amount: Money(minorUnits: 0, currency: 'SAR'), status: ClaimStatus.values.first, exported: false), ExpenseClaim(id: 'expense-claim-1', name: 'Sample ExpenseClaim 1', amount: Money(minorUnits: 15000, currency: 'SAR'), status: ClaimStatus.values.first, exported: false), ExpenseClaim(id: 'expense-claim-2', name: 'Sample ExpenseClaim 2', amount: Money(minorUnits: 25000, currency: 'SAR'), status: ClaimStatus.values.first, exported: false)];

  @override
  Future<List<ExpenseClaim>> listExpenseClaims() async => List.unmodifiable(_items);

  @override
  Future<ExpenseClaim> createExpenseClaim(ExpenseClaim claim) async {
    Outbox.instance.enqueue(
      entity: 'ExpenseClaim',
      entityId: claim.id.toString(),
      action: 'create',
      payload: ExpenseClaimModel.fromEntity(claim).toJson(),
    );
    _items.add(claim);
    AuditLog.instance.append(recordMutation(
      entity: 'ExpenseClaim',
      entityId: claim.id.toString(),
      action: 'create',
      actor: Session.instance.actorId ?? 'system',
      after: ExpenseClaimModel.fromEntity(claim).toJson(),
    ));
    return claim;
  }

  @override
  Future<void> updateExpenseClaim(ExpenseClaim claim) async {
    final idx = _items.indexWhere((e) => e.id == claim.id);
    if (idx != -1 && _items[idx].exported == true) {
      throw StateError('ExpenseClaim ${_items[idx].id} is exported and immutable — corrections require void + clone, not edit.');
    }
    if (idx != -1) {
      Outbox.instance.enqueue(
        entity: 'ExpenseClaim',
        entityId: claim.id.toString(),
        action: 'update',
        payload: ExpenseClaimModel.fromEntity(claim).toJson(),
      );
    }
    final before = idx != -1 ? ExpenseClaimModel.fromEntity(_items[idx]).toJson() : null;
    if (idx != -1) _items[idx] = claim;
    if (idx != -1) {
      AuditLog.instance.append(recordMutation(
        entity: 'ExpenseClaim',
        entityId: claim.id.toString(),
        action: 'update',
        actor: Session.instance.actorId ?? 'system',
        before: before,
        after: ExpenseClaimModel.fromEntity(claim).toJson(),
      ));
    }
  }

  @override
  Future<void> deleteExpenseClaim(String id) async {
    final _matches = _items.where((e) => e.id == id);
    final _existing = _matches.isEmpty ? null : _matches.first;
    if (_existing != null && _existing.exported == true) {
      throw StateError('ExpenseClaim ${id} is exported and immutable — corrections require void + clone, not delete.');
    }
    if (_existing != null) {
      Outbox.instance.enqueue(entity: 'ExpenseClaim', entityId: id.toString(), action: 'delete');
    }
    _items.removeWhere((e) => e.id == id);
    if (_existing != null) {
      AuditLog.instance.append(recordMutation(
        entity: 'ExpenseClaim',
        entityId: id.toString(),
        action: 'delete',
        actor: Session.instance.actorId ?? 'system',
        before: ExpenseClaimModel.fromEntity(_existing).toJson(),
      ));
    }
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
