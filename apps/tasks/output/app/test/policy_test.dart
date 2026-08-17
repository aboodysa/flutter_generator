// [generated] generator=PolicyTestGenerator template=policy_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_tasks/main.dart';
import 'package:rasheed_replica_tasks/core/router.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/di.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('Task: HighPriority (block) prevents Save until waived', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task/new');
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'high'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('High-priority tasks require manager sign-off before creation.'), findsOneWidget, reason: 'the employee must see the verdict message before submit');
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNull, reason: 'a block verdict must prevent Save until waived');
  });

  testWidgets('Task: HighPriority waive requires a reason, then re-enables Save', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task/new');
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'high'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(tester.widget<TextButton>(find.descendant(of: find.ancestor(of: find.textContaining('High-priority tasks require manager sign-off before creation.'), matching: find.byType(Card)), matching: find.widgetWithText(TextButton, 'Waive'))).onPressed, isNull, reason: 'Waive must stay disabled until a reason is typed (mandatory comment)');
    await tester.enterText(find.descendant(of: find.ancestor(of: find.textContaining('High-priority tasks require manager sign-off before creation.'), matching: find.byType(Card)), matching: find.widgetWithText(TextField, 'Waive reason')), 'Reviewed and approved offline.');
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: find.ancestor(of: find.textContaining('High-priority tasks require manager sign-off before creation.'), matching: find.byType(Card)), matching: find.widgetWithText(TextButton, 'Waive')));
    await tester.pumpAndSettle();
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a waived verdict must no longer prevent Save');
  });
}
