// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/usecases/create_transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/usecases/delete_transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/usecases/list_transactions.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_filter.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/usecases/update_transaction.dart';

enum TransactionListStatus { initial, loading, success, failure }

class TransactionListState extends Equatable {
  final TransactionListStatus status;
  final List<Transaction> transactions;
  final String? errorMessage;
  final TransactionFilter filter;

  const TransactionListState({
    this.status = TransactionListStatus.initial,
    this.transactions = const [],
    this.errorMessage,
    this.filter = const TransactionFilter(),
  });

  TransactionListState copyWith({
    TransactionListStatus? status,
    List<Transaction>? transactions,
    String? errorMessage,
    TransactionFilter? filter,
  }) => TransactionListState(
    status: status ?? this.status,
    transactions: transactions ?? this.transactions,
    errorMessage: errorMessage,
    filter: filter ?? this.filter,
  );

  @override
  List<Object?> get props => [status, transactions, errorMessage, filter];
}

class TransactionListCubit extends Cubit<TransactionListState> {
  final ListTransactions _listTransactions;
  final CreateTransaction? _createTransaction;
  final UpdateTransaction? _updateTransaction;
  final DeleteTransaction? _deleteTransaction;
  TransactionListCubit(this._listTransactions, [this._createTransaction, this._updateTransaction, this._deleteTransaction]) : super(const TransactionListState());

  Future<void> load() async {
    emit(state.copyWith(status: TransactionListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listTransactions.call(TransactionFilter(search: null, categoryIds: null, minAmount: null, maxAmount: null));
      emit(state.copyWith(status: TransactionListStatus.success, transactions: items));
    } catch (e) {
      emit(state.copyWith(status: TransactionListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(Transaction item) async {
    if (_createTransaction != null) await _createTransaction!.call(item);
    emit(state.copyWith(transactions: [...state.transactions, item]));
  }

  Future<void> update(Transaction item) async {
    if (_updateTransaction != null) await _updateTransaction!.call(item);
    final idx = state.transactions.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<Transaction>.of(state.transactions)..[idx] = item;
    emit(state.copyWith(transactions: next));
  }

  Future<void> delete(String id) async {
    if (_deleteTransaction != null) await _deleteTransaction!.call(id);
    emit(state.copyWith(transactions: state.transactions.where((e) => e.id != id).toList()));
  }
}
