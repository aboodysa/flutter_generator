// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR. The [user] region below is user-owned.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/repositories/transaction_repository.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/data/datasources/transaction_remote_data_source.dart';

class TransactionRepositoryImpl implements TransactionRepository {
  final TransactionRemoteDataSource datasource;
  const TransactionRepositoryImpl(this.datasource);

  // [user] region:user — implement each TransactionRepository method by delegating to datasource + mapping DTO → entity.
  @override
  // noSuchMethod to satisfy the interface until [user] regions are filled:
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
