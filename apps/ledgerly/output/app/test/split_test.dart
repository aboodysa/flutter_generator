// [generated] generator=SplitTestGenerator template=split_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR + Split.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_ledgerly/main.dart';
import 'package:rasheed_replica_ledgerly/core/router.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/di.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';
import 'package:rasheed_replica_ledgerly/core/session.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  test('validateSplit oracle case 1: valid', () {
    expect(validateSplit([const SplitLine(category: 'x', percent: 100)]), equals(<String>[]));
  });

  test('validateSplit oracle case 2: valid', () {
    expect(validateSplit([const SplitLine(category: 'x', percent: 90), const SplitLine(category: 'x', percent: 10)]), equals(<String>[]));
  });

  test('validateSplit oracle case 3: Split must sum to exactly 100% (currently 105.00%).', () {
    expect(validateSplit([const SplitLine(category: 'x', percent: 95), const SplitLine(category: 'x', percent: 10)]), equals(['Split must sum to exactly 100% (currently 105.00%).']));
  });

  test('validateSplit oracle case 4: Split must sum to exactly 100% (currently 50.00%).', () {
    expect(validateSplit([const SplitLine(category: 'x', percent: 50)]), equals(['Split must sum to exactly 100% (currently 50.00%).']));
  });

  test('validateSplit oracle case 5: valid', () {
    expect(validateSplit(const <SplitLine>[]), equals(<String>[]));
  });

  testWidgets('ExpenseClaim: split must sum to exactly 100% before Save is enabled', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/expense-claim/new');
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, 'Add split'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, 'Add split'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Category').at(0), 'Travel');
    await tester.enterText(find.widgetWithText(TextField, '%').at(0), '90');
    await tester.enterText(find.widgetWithText(TextField, 'Category').at(1), 'Meals');
    await tester.enterText(find.widgetWithText(TextField, '%').at(1), '5');
    await tester.pumpAndSettle();
    expect(find.textContaining('Split total: 95.00%'), findsOneWidget);
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNull, reason: 'a split that does not sum to 100% must block Save');
    await tester.enterText(find.widgetWithText(TextField, '%').at(1), '10');
    await tester.pumpAndSettle();
    expect(find.textContaining('Split total: 100.00%'), findsOneWidget);
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a split summing to exactly 100% must unblock Save');
  });
}
