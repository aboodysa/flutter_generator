// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_ledgerly/features/auth/data/repositories/user_repository_in_memory_impl.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/data/repositories/expense_claim_repository_in_memory_impl.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/data/repositories/expense_claim_split_repository_in_memory_impl.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/data/repositories/approval_repository_in_memory_impl.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/data/repositories/meal_budget_repository_in_memory_impl.dart';
import 'package:rasheed_replica_ledgerly/features/auth/domain/repositories/user_repository.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/repositories/expense_claim_repository.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/repositories/expense_claim_split_repository.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/repositories/approval_repository.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/repositories/meal_budget_repository.dart';
import 'package:rasheed_replica_ledgerly/features/auth/domain/usecases/list_users.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/list_expense_claims.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/create_expense_claim.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/update_expense_claim.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/delete_expense_claim.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/list_expense_claim_splits.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/create_expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/update_expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/delete_expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/usecases/list_approvals.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/usecases/update_approval.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/usecases/list_meal_budgets.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/usecases/create_meal_budget.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/usecases/update_meal_budget.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/usecases/delete_meal_budget.dart';
import 'package:rasheed_replica_ledgerly/features/auth/presentation/state/user_list.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/state/expense_claim_list.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/state/expense_claim_split_list.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/presentation/state/approval_list.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/presentation/state/meal_budget_list.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<UserRepository>(() => UserRepositoryInMemoryImpl());
  sl.registerLazySingleton<ExpenseClaimRepository>(() => ExpenseClaimRepositoryInMemoryImpl());
  sl.registerLazySingleton<ExpenseClaimSplitRepository>(() => ExpenseClaimSplitRepositoryInMemoryImpl());
  sl.registerLazySingleton<ApprovalRepository>(() => ApprovalRepositoryInMemoryImpl());
  sl.registerLazySingleton<MealBudgetRepository>(() => MealBudgetRepositoryInMemoryImpl());
  sl.registerLazySingleton<ListUsers>(() => ListUsers(sl<UserRepository>()));
  sl.registerLazySingleton<ListExpenseClaims>(() => ListExpenseClaims(sl<ExpenseClaimRepository>()));
  sl.registerLazySingleton<CreateExpenseClaim>(() => CreateExpenseClaim(sl<ExpenseClaimRepository>()));
  sl.registerLazySingleton<UpdateExpenseClaim>(() => UpdateExpenseClaim(sl<ExpenseClaimRepository>()));
  sl.registerLazySingleton<DeleteExpenseClaim>(() => DeleteExpenseClaim(sl<ExpenseClaimRepository>()));
  sl.registerLazySingleton<ListExpenseClaimSplits>(() => ListExpenseClaimSplits(sl<ExpenseClaimSplitRepository>()));
  sl.registerLazySingleton<CreateExpenseClaimSplit>(() => CreateExpenseClaimSplit(sl<ExpenseClaimSplitRepository>()));
  sl.registerLazySingleton<UpdateExpenseClaimSplit>(() => UpdateExpenseClaimSplit(sl<ExpenseClaimSplitRepository>()));
  sl.registerLazySingleton<DeleteExpenseClaimSplit>(() => DeleteExpenseClaimSplit(sl<ExpenseClaimSplitRepository>()));
  sl.registerLazySingleton<ListApprovals>(() => ListApprovals(sl<ApprovalRepository>()));
  sl.registerLazySingleton<UpdateApproval>(() => UpdateApproval(sl<ApprovalRepository>()));
  sl.registerLazySingleton<ListMealBudgets>(() => ListMealBudgets(sl<MealBudgetRepository>()));
  sl.registerLazySingleton<CreateMealBudget>(() => CreateMealBudget(sl<MealBudgetRepository>()));
  sl.registerLazySingleton<UpdateMealBudget>(() => UpdateMealBudget(sl<MealBudgetRepository>()));
  sl.registerLazySingleton<DeleteMealBudget>(() => DeleteMealBudget(sl<MealBudgetRepository>()));
  sl.registerFactory<UserListCubit>(() => UserListCubit(sl<ListUsers>()));
  sl.registerFactory<ExpenseClaimListCubit>(() => ExpenseClaimListCubit(sl<ListExpenseClaims>(), sl<CreateExpenseClaim>(), sl<UpdateExpenseClaim>(), sl<DeleteExpenseClaim>()));
  sl.registerFactory<ExpenseClaimSplitListCubit>(() => ExpenseClaimSplitListCubit(sl<ListExpenseClaimSplits>(), sl<CreateExpenseClaimSplit>(), sl<UpdateExpenseClaimSplit>(), sl<DeleteExpenseClaimSplit>()));
  sl.registerFactory<ApprovalListCubit>(() => ApprovalListCubit(sl<ListApprovals>(), sl<UpdateApproval>()));
  sl.registerFactory<MealBudgetListCubit>(() => MealBudgetListCubit(sl<ListMealBudgets>(), sl<CreateMealBudget>(), sl<UpdateMealBudget>(), sl<DeleteMealBudget>()));
}
