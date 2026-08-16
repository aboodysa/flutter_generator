// [generated] generator=OutboxTestGenerator template=outbox_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/data/repositories/expense_claim_repository_in_memory_impl.dart';

void main() {
  test('enqueue adds a pending message', () {
    final before = Outbox.instance.pending().length;
    final msg = Outbox.instance.enqueue(entity: 'Widget', entityId: 'w-1', action: 'create', payload: {'name': 'demo'});
    expect(Outbox.instance.pending().length, before + 1);
    expect(msg.status, OutboxStatus.pending);
    expect(msg.attempts, 0);
    expect(msg.entity, 'Widget');
    expect(msg.action, 'create');
  });

  test('markSent removes a message from pending() without deleting its history', () {
    final msg = Outbox.instance.enqueue(entity: 'Widget', entityId: 'w-2', action: 'update');
    Outbox.instance.markSent(msg.id);
    expect(Outbox.instance.pending().any((m) => m.id == msg.id), isFalse);
    expect(Outbox.instance.all.any((m) => m.id == msg.id && m.status == OutboxStatus.sent), isTrue);
  });

  test('markFailed increments attempts and records the error; retry() makes it pending again', () {
    final msg = Outbox.instance.enqueue(entity: 'Widget', entityId: 'w-3', action: 'delete');
    Outbox.instance.markFailed(msg.id, 'network unreachable');
    final failed = Outbox.instance.all.firstWhere((m) => m.id == msg.id);
    expect(failed.status, OutboxStatus.failed);
    expect(failed.attempts, 1);
    expect(failed.lastError, 'network unreachable');
    expect(Outbox.instance.pending().any((m) => m.id == msg.id), isFalse, reason: 'a failed message is not pending until retried');

    Outbox.instance.retry(msg.id);
    final retried = Outbox.instance.all.firstWhere((m) => m.id == msg.id);
    expect(retried.status, OutboxStatus.pending);
    expect(Outbox.instance.pending().any((m) => m.id == msg.id), isTrue);
  });

  test('pending() replay order is deterministic FIFO — insertion order survives an out-of-order markSent', () {
    final a = Outbox.instance.enqueue(entity: 'Order', entityId: 'o-a', action: 'create');
    final b = Outbox.instance.enqueue(entity: 'Order', entityId: 'o-b', action: 'create');
    final c = Outbox.instance.enqueue(entity: 'Order', entityId: 'o-c', action: 'create');
    Outbox.instance.markSent(b.id);
    final ids = Outbox.instance.pending().map((m) => m.id).where((id) => id == a.id || id == c.id).toList();
    expect(ids, [a.id, c.id], reason: 'replay must preserve original enqueue order');
  });

  test('a repo createExpenseClaim() write-ahead-enqueues an OutboxMessage before returning', () async {
    final repo = ExpenseClaimRepositoryInMemoryImpl();
    final before = Outbox.instance.pending().length;
    await repo.createExpenseClaim(ExpenseClaim(id: 'expense-claim-1', name: 'Sample ExpenseClaim 1', amount: Money(minorUnits: 15000, currency: 'SAR'), status: ClaimStatus.values.first, exported: false));
    final pending = Outbox.instance.pending();
    expect(pending.length, before + 1, reason: 'create() must write-ahead-enqueue exactly one message');
    expect(pending.last.entity, 'ExpenseClaim');
    expect(pending.last.action, 'create');
    expect(pending.last.status, OutboxStatus.pending);
  });
}
