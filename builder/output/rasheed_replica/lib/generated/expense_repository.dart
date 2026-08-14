// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'transaction_entity.dart';
import 'transaction_feedback_entity.dart';
import 'transaction_query.dart';
import 'transactions_page.dart';

abstract interface class ExpenseRepository {
  Stream<TransactionsPage> watchTransactions(TransactionQuery query, {required String userId, String? languageCode, bool localOnly = false});
  Future<TransactionEntity> getSimpleExpense(String transactionCode, {int page = 1, int limit = 10, required String accountId, required String userId});
  Future<TransactionEntity> getDetailedExpense(String transactionCode, {int page = 1, int limit = 10, required String accountId, required String userId, String? languageCode});
  Future<TransactionFeedbackEntity> submitTransactionFeedback({required String reaction, required String comment, required TransactionEntity transaction, required String accountCode});
}
