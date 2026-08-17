// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_expense/features/expense/data/repositories/expense_repository_in_memory_impl.dart';
import 'package:rasheed_replica_expense/features/expense/domain/repositories/expense_repository.dart';
import 'package:rasheed_replica_expense/features/expense/presentation/state/all_expenses.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<ExpenseRepository>(() => ExpenseRepositoryInMemoryImpl());
  sl.registerFactory<AllExpensesCubit>(() => AllExpensesCubit());
}
