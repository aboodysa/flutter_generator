// [generated] generator=GoldenTestGenerator template=golden.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_expense_tracker/generated.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('TransactionListScreen renders (golden)', (tester) async {
    await tester.pumpWidget(BlocProvider<TransactionListCubit>(
      create: (_) => TransactionListCubit(),
      child: const MaterialApp(home: TransactionListScreen()),
    ));
    await expectLater(find.byType(TransactionListScreen), matchesGoldenFile('goldens/transaction_list_screen.png'));
  });
}
