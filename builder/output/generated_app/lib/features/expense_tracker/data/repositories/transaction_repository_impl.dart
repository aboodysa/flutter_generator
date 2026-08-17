// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/repositories/transaction_repository.dart';
import 'package:rasheed_replica_expense_tracker/core/money.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/payment_method.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_filter.dart';

class TransactionRepositoryImpl implements TransactionRepository {
  final List<Transaction> _items = [Transaction(id: 'x', amount: Money(minorUnits: 0, currency: 'SAR'), date: DateTime(2024), paymentMethod: PaymentMethod.values.first), Transaction(id: 'transaction-1', amount: Money(minorUnits: 15000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 1', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 1', items: const [], attachments: const []), Transaction(id: 'transaction-2', amount: Money(minorUnits: 25000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 2', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 2', items: const [], attachments: const [])];

  @override
  Future<List<Transaction>> listTransactions(TransactionFilter filter) async => List.unmodifiable(_items);

  @override
  Future<Transaction> getTransactionDetail(String id) async =>
      _items.firstWhere((e) => e.id == id, orElse: () => _items.first);

  @override
  Future<Transaction> createTransaction(Transaction transaction) async {
    _items.add(transaction);
    return transaction;
  }

  @override
  Future<void> updateTransaction(Transaction transaction) async {
    final idx = _items.indexWhere((e) => e.id == transaction.id);
    if (idx != -1) _items[idx] = transaction;
  }

  @override
  Future<void> deleteTransaction(String id) async {
    _items.removeWhere((e) => e.id == id);
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
