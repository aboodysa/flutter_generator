// [generated] generator=BackTestGenerator template=back_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_ledgerly/main.dart';
import 'package:rasheed_replica_ledgerly/core/router.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';
import 'package:rasheed_replica_ledgerly/core/di.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('ExpenseClaim: detail screen back button returns to the list', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/expense-claim');
    await tester.pumpAndSettle();
    appRouter.push('/expense-claim/x');
    await tester.pumpAndSettle();
    expect(find.byType(ExpenseClaimDetailScreen), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(ExpenseClaimListScreen), findsOneWidget);
  });

  testWidgets('MealBudget: detail screen back button returns to the list', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/meal-budget');
    await tester.pumpAndSettle();
    appRouter.push('/meal-budget/x');
    await tester.pumpAndSettle();
    expect(find.byType(MealBudgetDetailScreen), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(MealBudgetListScreen), findsOneWidget);
  });
}
