// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_feedback.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_filter.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transactions_page.dart';

abstract interface class TransactionRepository {
  Future<List<Transaction>> listTransactions(TransactionFilter filter);
  Future<Transaction> getTransactionDetail(String id);
  Stream<TransactionsPage> watchTransactions(TransactionFilter filter);
  Future<TransactionFeedback> submitFeedback({required String reaction, required String comment});
}
