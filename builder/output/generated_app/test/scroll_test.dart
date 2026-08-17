// [generated] generator=ScrollTestGenerator template=scroll_test_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_expense_tracker/generated.dart';
import 'package:rasheed_replica_expense_tracker/core/theme.dart';

class _NoOpTransactionRepository implements TransactionRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededTransactionListCubit extends TransactionListCubit {
  _SeededTransactionListCubit() : super(ListTransactions(_NoOpTransactionRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: TransactionListStatus.success,
      transactions: [
        Transaction(id: 'transaction-1', amount: Money(minorUnits: 15000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 1', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 1', items: const [], attachments: const []),
        Transaction(id: 'transaction-2', amount: Money(minorUnits: 25000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 2', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 2', items: const [], attachments: const []),
        Transaction(id: 'transaction-3', amount: Money(minorUnits: 35000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 3', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 3', items: const [], attachments: const []),
        Transaction(id: 'transaction-4', amount: Money(minorUnits: 45000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 4', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 4', items: const [], attachments: const []),
        Transaction(id: 'transaction-5', amount: Money(minorUnits: 55000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 5', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 5', items: const [], attachments: const []),
        Transaction(id: 'transaction-6', amount: Money(minorUnits: 65000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 6', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 6', items: const [], attachments: const []),
        Transaction(id: 'transaction-7', amount: Money(minorUnits: 75000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 7', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 7', items: const [], attachments: const []),
        Transaction(id: 'transaction-8', amount: Money(minorUnits: 85000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 8', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 8', items: const [], attachments: const []),
        Transaction(id: 'transaction-9', amount: Money(minorUnits: 95000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 9', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 9', items: const [], attachments: const []),
        Transaction(id: 'transaction-10', amount: Money(minorUnits: 105000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 10', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 10', items: const [], attachments: const []),
        Transaction(id: 'transaction-11', amount: Money(minorUnits: 115000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 11', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 11', items: const [], attachments: const []),
        Transaction(id: 'transaction-12', amount: Money(minorUnits: 125000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 12', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 12', items: const [], attachments: const []),
        Transaction(id: 'transaction-13', amount: Money(minorUnits: 135000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 13', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 13', items: const [], attachments: const []),
        Transaction(id: 'transaction-14', amount: Money(minorUnits: 145000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 14', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 14', items: const [], attachments: const []),
        Transaction(id: 'transaction-15', amount: Money(minorUnits: 155000, currency: 'SAR'), date: DateTime(2025), merchant: 'Sample Transaction 15', category: null, paymentMethod: PaymentMethod.values.first, note: 'Sample item 15', items: const [], attachments: const []),
      ],
    ));
  }
}

void main() {
  testWidgets('TransactionListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<TransactionListCubit>(
      create: (_) => _SeededTransactionListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const TransactionListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('transaction-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('transaction-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });
}
