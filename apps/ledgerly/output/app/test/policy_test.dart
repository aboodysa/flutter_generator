// [generated] generator=PolicyTestGenerator template=policy_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_ledgerly/main.dart';
import 'package:rasheed_replica_ledgerly/core/router.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/di.dart';
import 'package:rasheed_replica_ledgerly/core/session.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('ExpenseClaim: StandardExpenseWarn (warn) shows a message but allows Save', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/expense-claim/new');
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Amount'), '501');
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('This expense is unusually large — please double-check the amount before submitting.'), findsOneWidget);
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a warn verdict must never block Save');
  });

  testWidgets('ExpenseClaim: LargeExpenseJustify (requireJustification) blocks Save until justified', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/expense-claim/new');
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Amount'), '2001');
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNull, reason: 'requireJustification must block Save until a justification is typed');
    await tester.enterText(find.widgetWithText(TextField, 'Justification'), 'Approved — see attached memo.');
    await tester.pumpAndSettle();
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'typing a justification must unblock Save');
  });

  testWidgets('ExpenseClaim: ExecutiveExpenseBlock (block) prevents Save until waived', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/expense-claim/new');
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Amount'), '15001');
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('Expenses of 15,000 SAR or more require executive approval outside this system.'), findsOneWidget, reason: 'the employee must see the verdict message before submit');
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNull, reason: 'a block verdict must prevent Save until waived');
  });

  testWidgets('ExpenseClaim: ExecutiveExpenseBlock waive requires a reason, then re-enables Save', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/expense-claim/new');
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Amount'), '15001');
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(tester.widget<TextButton>(find.descendant(of: find.ancestor(of: find.textContaining('Expenses of 15,000 SAR or more require executive approval outside this system.'), matching: find.byType(Card)), matching: find.widgetWithText(TextButton, 'Waive'))).onPressed, isNull, reason: 'Waive must stay disabled until a reason is typed (mandatory comment)');
    await tester.enterText(find.descendant(of: find.ancestor(of: find.textContaining('Expenses of 15,000 SAR or more require executive approval outside this system.'), matching: find.byType(Card)), matching: find.widgetWithText(TextField, 'Waive reason')), 'Reviewed and approved offline.');
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: find.ancestor(of: find.textContaining('Expenses of 15,000 SAR or more require executive approval outside this system.'), matching: find.byType(Card)), matching: find.widgetWithText(TextButton, 'Waive')));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Justification'), 'Approved — see attached memo.');
    await tester.pumpAndSettle();
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a waived verdict must no longer prevent Save');
  });

  testWidgets('MealBudget: BudgetCommittedWarn (warn) shows a message but allows Save', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/meal-budget/new');
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Committed'), '301');
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('Committed spend for this category is high — review before approving more expenses.'), findsOneWidget);
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a warn verdict must never block Save');
  });

  testWidgets('MealBudget: BudgetCommittedBlock (block) prevents Save until waived', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/meal-budget/new');
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Committed'), '801');
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('Committed spend has reached the category cap — no further commitments allowed.'), findsOneWidget, reason: 'the employee must see the verdict message before submit');
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNull, reason: 'a block verdict must prevent Save until waived');
  });

  testWidgets('MealBudget: BudgetActualJustify (requireJustification) blocks Save until justified', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/meal-budget/new');
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Actual'), '401');
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNull, reason: 'requireJustification must block Save until a justification is typed');
    await tester.enterText(find.widgetWithText(TextField, 'Justification'), 'Approved — see attached memo.');
    await tester.pumpAndSettle();
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'typing a justification must unblock Save');
  });
}
