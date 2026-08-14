// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'transactionentity.dart';

abstract interface class ExpenseRepository {
  Future<List<TransactionEntity>> getTransactions(TransactionEntity entity);
  Future<TransactionEntity> getTransaction(String id);
  Future<TransactionEntity> createTransaction(TransactionEntity entity);
  Future<void> deleteTransaction(String id);
}
