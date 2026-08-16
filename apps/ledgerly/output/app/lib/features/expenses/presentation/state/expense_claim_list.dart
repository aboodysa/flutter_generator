// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/create_expense_claim.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/delete_expense_claim.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/list_expense_claims.dart';
import 'package:rasheed_replica_ledgerly/core/no_params.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/usecases/update_expense_claim.dart';

enum ExpenseClaimListStatus { initial, loading, success, failure }

class ExpenseClaimListState extends Equatable {
  final ExpenseClaimListStatus status;
  final List<ExpenseClaim> expenseClaims;
  final String? errorMessage;

  const ExpenseClaimListState({
    this.status = ExpenseClaimListStatus.initial,
    this.expenseClaims = const [],
    this.errorMessage,
  });

  ExpenseClaimListState copyWith({
    ExpenseClaimListStatus? status,
    List<ExpenseClaim>? expenseClaims,
    String? errorMessage,
  }) => ExpenseClaimListState(
    status: status ?? this.status,
    expenseClaims: expenseClaims ?? this.expenseClaims,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, expenseClaims, errorMessage];
}

class ExpenseClaimListCubit extends Cubit<ExpenseClaimListState> {
  final ListExpenseClaims _listExpenseClaims;
  final CreateExpenseClaim? _createExpenseClaim;
  final UpdateExpenseClaim? _updateExpenseClaim;
  final DeleteExpenseClaim? _deleteExpenseClaim;
  ExpenseClaimListCubit(this._listExpenseClaims, [this._createExpenseClaim, this._updateExpenseClaim, this._deleteExpenseClaim]) : super(const ExpenseClaimListState());

  Future<void> load() async {
    emit(state.copyWith(status: ExpenseClaimListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listExpenseClaims.call(NoParams());
      emit(state.copyWith(status: ExpenseClaimListStatus.success, expenseClaims: items));
    } catch (e) {
      emit(state.copyWith(status: ExpenseClaimListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(ExpenseClaim item) async {
    if (_createExpenseClaim != null) await _createExpenseClaim!.call(item);
    emit(state.copyWith(expenseClaims: [...state.expenseClaims, item]));
  }

  Future<void> update(ExpenseClaim item) async {
    if (_updateExpenseClaim != null) await _updateExpenseClaim!.call(item);
    final idx = state.expenseClaims.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<ExpenseClaim>.of(state.expenseClaims)..[idx] = item;
    emit(state.copyWith(expenseClaims: next));
  }

  Future<void> delete(String id) async {
    if (_deleteExpenseClaim != null) await _deleteExpenseClaim!.call(id);
    emit(state.copyWith(expenseClaims: state.expenseClaims.where((e) => e.id != id).toList()));
  }
}
