// [generated] generator=ScrollTestGenerator template=scroll_test_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';

class _NoOpUserRepository implements UserRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededUserListCubit extends UserListCubit {
  _SeededUserListCubit() : super(ListUsers(_NoOpUserRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: UserListStatus.success,
      users: [
        User(id: 'user-1', name: 'Sample User 1', email: 'Sample item 1', role: UserRole.values.first),
        User(id: 'user-2', name: 'Sample User 2', email: 'Sample item 2', role: UserRole.values.first),
        User(id: 'user-3', name: 'Sample User 3', email: 'Sample item 3', role: UserRole.values.first),
        User(id: 'user-4', name: 'Sample User 4', email: 'Sample item 4', role: UserRole.values.first),
        User(id: 'user-5', name: 'Sample User 5', email: 'Sample item 5', role: UserRole.values.first),
        User(id: 'user-6', name: 'Sample User 6', email: 'Sample item 6', role: UserRole.values.first),
        User(id: 'user-7', name: 'Sample User 7', email: 'Sample item 7', role: UserRole.values.first),
        User(id: 'user-8', name: 'Sample User 8', email: 'Sample item 8', role: UserRole.values.first),
        User(id: 'user-9', name: 'Sample User 9', email: 'Sample item 9', role: UserRole.values.first),
        User(id: 'user-10', name: 'Sample User 10', email: 'Sample item 10', role: UserRole.values.first),
        User(id: 'user-11', name: 'Sample User 11', email: 'Sample item 11', role: UserRole.values.first),
        User(id: 'user-12', name: 'Sample User 12', email: 'Sample item 12', role: UserRole.values.first),
        User(id: 'user-13', name: 'Sample User 13', email: 'Sample item 13', role: UserRole.values.first),
        User(id: 'user-14', name: 'Sample User 14', email: 'Sample item 14', role: UserRole.values.first),
        User(id: 'user-15', name: 'Sample User 15', email: 'Sample item 15', role: UserRole.values.first),
      ],
    ));
  }
}

class _NoOpExpenseClaimRepository implements ExpenseClaimRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededExpenseClaimListCubit extends ExpenseClaimListCubit {
  _SeededExpenseClaimListCubit() : super(ListExpenseClaims(_NoOpExpenseClaimRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: ExpenseClaimListStatus.success,
      expenseClaims: [
        ExpenseClaim(id: 'expense-claim-1', name: 'Sample ExpenseClaim 1', amount: Money(minorUnits: 15000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-2', name: 'Sample ExpenseClaim 2', amount: Money(minorUnits: 25000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-3', name: 'Sample ExpenseClaim 3', amount: Money(minorUnits: 35000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-4', name: 'Sample ExpenseClaim 4', amount: Money(minorUnits: 45000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-5', name: 'Sample ExpenseClaim 5', amount: Money(minorUnits: 55000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-6', name: 'Sample ExpenseClaim 6', amount: Money(minorUnits: 65000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-7', name: 'Sample ExpenseClaim 7', amount: Money(minorUnits: 75000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-8', name: 'Sample ExpenseClaim 8', amount: Money(minorUnits: 85000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-9', name: 'Sample ExpenseClaim 9', amount: Money(minorUnits: 95000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-10', name: 'Sample ExpenseClaim 10', amount: Money(minorUnits: 105000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-11', name: 'Sample ExpenseClaim 11', amount: Money(minorUnits: 115000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-12', name: 'Sample ExpenseClaim 12', amount: Money(minorUnits: 125000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-13', name: 'Sample ExpenseClaim 13', amount: Money(minorUnits: 135000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-14', name: 'Sample ExpenseClaim 14', amount: Money(minorUnits: 145000, currency: 'SAR'), status: ClaimStatus.values.first),
        ExpenseClaim(id: 'expense-claim-15', name: 'Sample ExpenseClaim 15', amount: Money(minorUnits: 155000, currency: 'SAR'), status: ClaimStatus.values.first),
      ],
    ));
  }
}

class _NoOpApprovalRepository implements ApprovalRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededApprovalListCubit extends ApprovalListCubit {
  _SeededApprovalListCubit() : super(ListApprovals(_NoOpApprovalRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: ApprovalListStatus.success,
      approvals: [
        Approval(id: 'approval-1', name: 'Sample Approval 1', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-2', name: 'Sample Approval 2', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-3', name: 'Sample Approval 3', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-4', name: 'Sample Approval 4', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-5', name: 'Sample Approval 5', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-6', name: 'Sample Approval 6', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-7', name: 'Sample Approval 7', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-8', name: 'Sample Approval 8', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-9', name: 'Sample Approval 9', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-10', name: 'Sample Approval 10', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-11', name: 'Sample Approval 11', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-12', name: 'Sample Approval 12', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-13', name: 'Sample Approval 13', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-14', name: 'Sample Approval 14', decision: ApprovalDecision.values.first),
        Approval(id: 'approval-15', name: 'Sample Approval 15', decision: ApprovalDecision.values.first),
      ],
    ));
  }
}

class _NoOpMealBudgetRepository implements MealBudgetRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededMealBudgetListCubit extends MealBudgetListCubit {
  _SeededMealBudgetListCubit() : super(ListMealBudgets(_NoOpMealBudgetRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: MealBudgetListStatus.success,
      mealBudgets: [
        MealBudget(id: 'meal-budget-1', name: 'Sample MealBudget 1', limit: Money(minorUnits: 15000, currency: 'SAR'), committed: Money(minorUnits: 15000, currency: 'SAR'), actual: Money(minorUnits: 15000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-2', name: 'Sample MealBudget 2', limit: Money(minorUnits: 25000, currency: 'SAR'), committed: Money(minorUnits: 25000, currency: 'SAR'), actual: Money(minorUnits: 25000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-3', name: 'Sample MealBudget 3', limit: Money(minorUnits: 35000, currency: 'SAR'), committed: Money(minorUnits: 35000, currency: 'SAR'), actual: Money(minorUnits: 35000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-4', name: 'Sample MealBudget 4', limit: Money(minorUnits: 45000, currency: 'SAR'), committed: Money(minorUnits: 45000, currency: 'SAR'), actual: Money(minorUnits: 45000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-5', name: 'Sample MealBudget 5', limit: Money(minorUnits: 55000, currency: 'SAR'), committed: Money(minorUnits: 55000, currency: 'SAR'), actual: Money(minorUnits: 55000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-6', name: 'Sample MealBudget 6', limit: Money(minorUnits: 65000, currency: 'SAR'), committed: Money(minorUnits: 65000, currency: 'SAR'), actual: Money(minorUnits: 65000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-7', name: 'Sample MealBudget 7', limit: Money(minorUnits: 75000, currency: 'SAR'), committed: Money(minorUnits: 75000, currency: 'SAR'), actual: Money(minorUnits: 75000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-8', name: 'Sample MealBudget 8', limit: Money(minorUnits: 85000, currency: 'SAR'), committed: Money(minorUnits: 85000, currency: 'SAR'), actual: Money(minorUnits: 85000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-9', name: 'Sample MealBudget 9', limit: Money(minorUnits: 95000, currency: 'SAR'), committed: Money(minorUnits: 95000, currency: 'SAR'), actual: Money(minorUnits: 95000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-10', name: 'Sample MealBudget 10', limit: Money(minorUnits: 105000, currency: 'SAR'), committed: Money(minorUnits: 105000, currency: 'SAR'), actual: Money(minorUnits: 105000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-11', name: 'Sample MealBudget 11', limit: Money(minorUnits: 115000, currency: 'SAR'), committed: Money(minorUnits: 115000, currency: 'SAR'), actual: Money(minorUnits: 115000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-12', name: 'Sample MealBudget 12', limit: Money(minorUnits: 125000, currency: 'SAR'), committed: Money(minorUnits: 125000, currency: 'SAR'), actual: Money(minorUnits: 125000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-13', name: 'Sample MealBudget 13', limit: Money(minorUnits: 135000, currency: 'SAR'), committed: Money(minorUnits: 135000, currency: 'SAR'), actual: Money(minorUnits: 135000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-14', name: 'Sample MealBudget 14', limit: Money(minorUnits: 145000, currency: 'SAR'), committed: Money(minorUnits: 145000, currency: 'SAR'), actual: Money(minorUnits: 145000, currency: 'SAR')),
        MealBudget(id: 'meal-budget-15', name: 'Sample MealBudget 15', limit: Money(minorUnits: 155000, currency: 'SAR'), committed: Money(minorUnits: 155000, currency: 'SAR'), actual: Money(minorUnits: 155000, currency: 'SAR')),
      ],
    ));
  }
}

void main() {
  testWidgets('UserListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<UserListCubit>(
      create: (_) => _SeededUserListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const UserListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('user-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('user-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });

  testWidgets('ExpenseClaimListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<ExpenseClaimListCubit>(
      create: (_) => _SeededExpenseClaimListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const ExpenseClaimListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('expense-claim-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('expense-claim-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });

  testWidgets('ApprovalListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<ApprovalListCubit>(
      create: (_) => _SeededApprovalListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const ApprovalListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('approval-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('approval-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });

  testWidgets('MealBudgetListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<MealBudgetListCubit>(
      create: (_) => _SeededMealBudgetListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const MealBudgetListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('meal-budget-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('meal-budget-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });
}
