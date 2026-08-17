// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/repositories/transaction_repository.dart';

class CreateTransaction {
  final TransactionRepository repository;
  const CreateTransaction(this.repository);

  Future<Transaction> call(Transaction params) => repository.createTransaction(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
