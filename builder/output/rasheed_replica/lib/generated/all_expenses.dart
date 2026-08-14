// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'transaction_entity.dart';
import 'transaction_filter.dart';

enum AllExpensesStatus { initial, loading, refreshing, success, failure }

class AllExpensesState extends Equatable {
  final AllExpensesStatus status;
  final List<TransactionEntity> transactions;
  final String? errorMessage;
  final List<TransactionEntity> visibleTransactions;
  final bool isFromCache;
  final String searchQuery;
  final String accountCode;
  final int limit;
  final TransactionFilter filter;

  const AllExpensesState({
    this.status = AllExpensesStatus.initial,
    this.transactions = const [],
    this.errorMessage,
    this.visibleTransactions = const [],
    this.isFromCache = false,
    this.searchQuery = '',
    this.accountCode = '',
    this.limit = 50,
    this.filter = const TransactionFilter(),
  });

  AllExpensesState copyWith({
    AllExpensesStatus? status,
    List<TransactionEntity>? transactions,
    String? errorMessage,
    List<TransactionEntity>? visibleTransactions,
    bool? isFromCache,
    String? searchQuery,
    String? accountCode,
    int? limit,
    TransactionFilter? filter,
  }) => AllExpensesState(
    status: status ?? this.status,
    transactions: transactions ?? this.transactions,
    errorMessage: errorMessage,
    visibleTransactions: visibleTransactions ?? this.visibleTransactions,
    isFromCache: isFromCache ?? this.isFromCache,
    searchQuery: searchQuery ?? this.searchQuery,
    accountCode: accountCode ?? this.accountCode,
    limit: limit ?? this.limit,
    filter: filter ?? this.filter,
  );

  @override
  List<Object?> get props => [status, transactions, errorMessage, visibleTransactions, isFromCache, searchQuery, accountCode, limit, filter];
}

class AllExpensesCubit extends Cubit<AllExpensesState> {
  AllExpensesCubit() : super(const AllExpensesState());

  Future<void> load() async {
    emit(state.copyWith(status: AllExpensesStatus.loading));
    try {
      // [user] region:user — implement data fetch via repository
      throw UnimplementedError();
    } catch (e) {
      emit(state.copyWith(status: AllExpensesStatus.failure, errorMessage: e.toString()));
    }
  }
}
