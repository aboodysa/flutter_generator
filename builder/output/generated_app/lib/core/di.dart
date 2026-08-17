// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/data/datasources/transaction_remote_data_source.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/data/repositories/transaction_repository_impl.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/repositories/transaction_repository.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/usecases/list_transactions.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/usecases/create_transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/usecases/update_transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/usecases/delete_transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/presentation/state/transaction_list.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<TransactionRemoteDataSource>(() => TransactionRemoteDataSource(sl<Dio>()));
  sl.registerLazySingleton<TransactionRepository>(() => TransactionRepositoryImpl());
  sl.registerLazySingleton<ListTransactions>(() => ListTransactions(sl<TransactionRepository>()));
  sl.registerLazySingleton<CreateTransaction>(() => CreateTransaction(sl<TransactionRepository>()));
  sl.registerLazySingleton<UpdateTransaction>(() => UpdateTransaction(sl<TransactionRepository>()));
  sl.registerLazySingleton<DeleteTransaction>(() => DeleteTransaction(sl<TransactionRepository>()));
  sl.registerFactory<TransactionListCubit>(() => TransactionListCubit(sl<ListTransactions>(), sl<CreateTransaction>(), sl<UpdateTransaction>(), sl<DeleteTransaction>()));
}
