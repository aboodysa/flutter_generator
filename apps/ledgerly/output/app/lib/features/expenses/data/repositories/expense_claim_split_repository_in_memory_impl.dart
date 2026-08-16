// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_ledgerly/features/expenses/domain/repositories/expense_claim_split_repository.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/data/models/expense_claim_split_model.dart';
import 'package:rasheed_replica_ledgerly/core/outbox.dart';

class ExpenseClaimSplitRepositoryInMemoryImpl implements ExpenseClaimSplitRepository {
  final List<ExpenseClaimSplit> _items = [ExpenseClaimSplit(id: 'x', expenseClaimId: 'x', category: 'x', percent: 0.0), ExpenseClaimSplit(id: 'expense-claim-split-1', expenseClaimId: 'Sample item 1', category: 'Sample item 1', percent: 150.0), ExpenseClaimSplit(id: 'expense-claim-split-2', expenseClaimId: 'Sample item 2', category: 'Sample item 2', percent: 250.0)];

  @override
  Future<List<ExpenseClaimSplit>> listExpenseClaimSplits() async => List.unmodifiable(_items);

  @override
  Future<ExpenseClaimSplit> createExpenseClaimSplit(ExpenseClaimSplit split) async {
    Outbox.instance.enqueue(
      entity: 'ExpenseClaimSplit',
      entityId: split.id.toString(),
      action: 'create',
      payload: ExpenseClaimSplitModel.fromEntity(split).toJson(),
    );
    _items.add(split);
    return split;
  }

  @override
  Future<void> updateExpenseClaimSplit(ExpenseClaimSplit split) async {
    final idx = _items.indexWhere((e) => e.id == split.id);
    if (idx != -1) {
      Outbox.instance.enqueue(
        entity: 'ExpenseClaimSplit',
        entityId: split.id.toString(),
        action: 'update',
        payload: ExpenseClaimSplitModel.fromEntity(split).toJson(),
      );
    }
    if (idx != -1) _items[idx] = split;
  }

  @override
  Future<void> deleteExpenseClaimSplit(String id) async {
    final _matches = _items.where((e) => e.id == id);
    final _existing = _matches.isEmpty ? null : _matches.first;
    if (_existing != null) {
      Outbox.instance.enqueue(entity: 'ExpenseClaimSplit', entityId: id.toString(), action: 'delete');
    }
    _items.removeWhere((e) => e.id == id);
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
