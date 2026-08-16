// TEMP harness — all flows (not committed; source of apps/<app>/output/goldens/)
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:rasheed_replica_ledgerly/main.dart';
import 'package:rasheed_replica_ledgerly/core/di.dart';
import 'package:rasheed_replica_ledgerly/core/router.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/screens/expense_claim_form_screen.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/presentation/screens/meal_budget_form_screen.dart';

void main() {
  setUpAll(() async {
    final font = FontLoader('Roboto');
    for (final f in const ['Roboto-Regular', 'Roboto-Medium', 'Roboto-Bold']) {
      font.addFont(rootBundle.load('assets/fonts/$f.ttf'));
    }
    await font.load();
    final icons = FontLoader('MaterialIcons')
      ..addFont(rootBundle.load('assets/fonts/MaterialIcons-Regular.otf'));
    await icons.load();
  });

  testWidgets('AuthLoginScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    await expectLater(find.byType(AuthLoginScreen), matchesGoldenFile('goldens/AuthLoginScreen_all.png'));
  });

  testWidgets('UserListScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    if (find.byType(AuthLoginScreen).evaluate().isNotEmpty) {
      await tester.tap(find.byType(AppListCard).first);
      await tester.pumpAndSettle();
    }
    appRouter.go('/user');
    await tester.pumpAndSettle();
    await expectLater(find.byType(UserListScreen), matchesGoldenFile('goldens/UserListScreen_all.png'));
  });

  testWidgets('ExpenseClaimListScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    if (find.byType(AuthLoginScreen).evaluate().isNotEmpty) {
      await tester.tap(find.byType(AppListCard).first);
      await tester.pumpAndSettle();
    }
    appRouter.go('/expense-claim');
    await tester.pumpAndSettle();
    await expectLater(find.byType(ExpenseClaimListScreen), matchesGoldenFile('goldens/ExpenseClaimListScreen_all.png'));
  });

  testWidgets('ExpenseClaimDetailScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    if (find.byType(AuthLoginScreen).evaluate().isNotEmpty) {
      await tester.tap(find.byType(AppListCard).first);
      await tester.pumpAndSettle();
    }
    appRouter.go('/expense-claim/x');
    await tester.pumpAndSettle();
    await expectLater(find.byType(ExpenseClaimDetailScreen), matchesGoldenFile('goldens/ExpenseClaimDetailScreen_all.png'));
  });

  testWidgets('ExpenseClaimFormScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    if (find.byType(AuthLoginScreen).evaluate().isNotEmpty) {
      await tester.tap(find.byType(AppListCard).first);
      await tester.pumpAndSettle();
    }
    appRouter.go('/expense-claim/new');
    await tester.pumpAndSettle();
    await expectLater(find.byType(ExpenseClaimFormScreen), matchesGoldenFile('goldens/ExpenseClaimFormScreen_all.png'));
  });

  testWidgets('ApprovalListScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    if (find.byType(AuthLoginScreen).evaluate().isNotEmpty) {
      await tester.tap(find.byType(AppListCard).first);
      await tester.pumpAndSettle();
    }
    appRouter.go('/approval');
    await tester.pumpAndSettle();
    await expectLater(find.byType(ApprovalListScreen), matchesGoldenFile('goldens/ApprovalListScreen_all.png'));
  });

  testWidgets('MealBudgetListScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    if (find.byType(AuthLoginScreen).evaluate().isNotEmpty) {
      await tester.tap(find.byType(AppListCard).first);
      await tester.pumpAndSettle();
    }
    appRouter.go('/meal-budget');
    await tester.pumpAndSettle();
    await expectLater(find.byType(MealBudgetListScreen), matchesGoldenFile('goldens/MealBudgetListScreen_all.png'));
  });

  testWidgets('MealBudgetDetailScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    if (find.byType(AuthLoginScreen).evaluate().isNotEmpty) {
      await tester.tap(find.byType(AppListCard).first);
      await tester.pumpAndSettle();
    }
    appRouter.go('/meal-budget/x');
    await tester.pumpAndSettle();
    await expectLater(find.byType(MealBudgetDetailScreen), matchesGoldenFile('goldens/MealBudgetDetailScreen_all.png'));
  });

  testWidgets('MealBudgetFormScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    if (find.byType(AuthLoginScreen).evaluate().isNotEmpty) {
      await tester.tap(find.byType(AppListCard).first);
      await tester.pumpAndSettle();
    }
    appRouter.go('/meal-budget/new');
    await tester.pumpAndSettle();
    await expectLater(find.byType(MealBudgetFormScreen), matchesGoldenFile('goldens/MealBudgetFormScreen_all.png'));
  });
}
