// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_filter.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/repositories/transaction_repository.dart';

class ListTransactions {
  final TransactionRepository repository;
  const ListTransactions(this.repository);

  Future<List<Transaction>> call(TransactionFilter params) => repository.listTransactions(params);
}
