// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/payment_method.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction_filter.dart';

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
  TransactionListCubit() : super(const TransactionListState());

  Future<void> load() async {
    emit(state.copyWith(status: TransactionListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      // Deterministic demo data so the app renders rows out of the box:
      emit(state.copyWith(status: TransactionListStatus.success, transactions: [Transaction(id: 'x', amount: 0.0, date: DateTime(2024), paymentMethod: PaymentMethod.values.first)]));
    } catch (e) {
      emit(state.copyWith(status: TransactionListStatus.failure, errorMessage: e.toString()));
    }
  }
}
