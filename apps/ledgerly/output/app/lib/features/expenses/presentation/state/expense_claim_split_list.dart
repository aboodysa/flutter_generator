// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/create_expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/delete_expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/list_expense_claim_splits.dart';
import 'package:rasheed_replica_ledgerly/core/no_params.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/update_expense_claim_split.dart';

enum ExpenseClaimSplitListStatus { initial, loading, success, failure }

class ExpenseClaimSplitListState extends Equatable {
  final ExpenseClaimSplitListStatus status;
  final List<ExpenseClaimSplit> expenseClaimSplits;
  final String? errorMessage;

  const ExpenseClaimSplitListState({
    this.status = ExpenseClaimSplitListStatus.initial,
    this.expenseClaimSplits = const [],
    this.errorMessage,
  });

  ExpenseClaimSplitListState copyWith({
    ExpenseClaimSplitListStatus? status,
    List<ExpenseClaimSplit>? expenseClaimSplits,
    String? errorMessage,
  }) => ExpenseClaimSplitListState(
    status: status ?? this.status,
    expenseClaimSplits: expenseClaimSplits ?? this.expenseClaimSplits,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, expenseClaimSplits, errorMessage];
}

class ExpenseClaimSplitListCubit extends Cubit<ExpenseClaimSplitListState> {
  final ListExpenseClaimSplits _listExpenseClaimSplits;
  final CreateExpenseClaimSplit? _createExpenseClaimSplit;
  final UpdateExpenseClaimSplit? _updateExpenseClaimSplit;
  final DeleteExpenseClaimSplit? _deleteExpenseClaimSplit;
  ExpenseClaimSplitListCubit(this._listExpenseClaimSplits, [this._createExpenseClaimSplit, this._updateExpenseClaimSplit, this._deleteExpenseClaimSplit]) : super(const ExpenseClaimSplitListState());

  Future<void> load() async {
    emit(state.copyWith(status: ExpenseClaimSplitListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listExpenseClaimSplits.call(NoParams());
      emit(state.copyWith(status: ExpenseClaimSplitListStatus.success, expenseClaimSplits: items));
    } catch (e) {
      emit(state.copyWith(status: ExpenseClaimSplitListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(ExpenseClaimSplit item) async {
    if (_createExpenseClaimSplit != null) await _createExpenseClaimSplit!.call(item);
    emit(state.copyWith(expenseClaimSplits: [...state.expenseClaimSplits, item]));
  }

  Future<void> update(ExpenseClaimSplit item) async {
    if (_updateExpenseClaimSplit != null) await _updateExpenseClaimSplit!.call(item);
    final idx = state.expenseClaimSplits.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<ExpenseClaimSplit>.of(state.expenseClaimSplits)..[idx] = item;
    emit(state.copyWith(expenseClaimSplits: next));
  }

  Future<void> delete(String id) async {
    if (_deleteExpenseClaimSplit != null) await _deleteExpenseClaimSplit!.call(id);
    emit(state.copyWith(expenseClaimSplits: state.expenseClaimSplits.where((e) => e.id != id).toList()));
  }
}
