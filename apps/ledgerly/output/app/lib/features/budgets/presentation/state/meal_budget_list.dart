// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/usecases/create_meal_budget.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/usecases/delete_meal_budget.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/usecases/list_meal_budgets.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';
import 'package:rasheed_replica_ledgerly/core/no_params.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/usecases/update_meal_budget.dart';

enum MealBudgetListStatus { initial, loading, success, failure }

class MealBudgetListState extends Equatable {
  final MealBudgetListStatus status;
  final List<MealBudget> mealBudgets;
  final String? errorMessage;

  const MealBudgetListState({
    this.status = MealBudgetListStatus.initial,
    this.mealBudgets = const [],
    this.errorMessage,
  });

  MealBudgetListState copyWith({
    MealBudgetListStatus? status,
    List<MealBudget>? mealBudgets,
    String? errorMessage,
  }) => MealBudgetListState(
    status: status ?? this.status,
    mealBudgets: mealBudgets ?? this.mealBudgets,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, mealBudgets, errorMessage];
}

class MealBudgetListCubit extends Cubit<MealBudgetListState> {
  final ListMealBudgets _listMealBudgets;
  final CreateMealBudget? _createMealBudget;
  final UpdateMealBudget? _updateMealBudget;
  final DeleteMealBudget? _deleteMealBudget;
  MealBudgetListCubit(this._listMealBudgets, [this._createMealBudget, this._updateMealBudget, this._deleteMealBudget]) : super(const MealBudgetListState());

  Future<void> load() async {
    emit(state.copyWith(status: MealBudgetListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listMealBudgets.call(NoParams());
      emit(state.copyWith(status: MealBudgetListStatus.success, mealBudgets: items));
    } catch (e) {
      emit(state.copyWith(status: MealBudgetListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(MealBudget item) async {
    if (_createMealBudget != null) await _createMealBudget!.call(item);
    emit(state.copyWith(mealBudgets: [...state.mealBudgets, item]));
  }

  Future<void> update(MealBudget item) async {
    if (_updateMealBudget != null) await _updateMealBudget!.call(item);
    final idx = state.mealBudgets.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<MealBudget>.of(state.mealBudgets)..[idx] = item;
    emit(state.copyWith(mealBudgets: next));
  }

  Future<void> delete(String id) async {
    if (_deleteMealBudget != null) await _deleteMealBudget!.call(id);
    emit(state.copyWith(mealBudgets: state.mealBudgets.where((e) => e.id != id).toList()));
  }
}
