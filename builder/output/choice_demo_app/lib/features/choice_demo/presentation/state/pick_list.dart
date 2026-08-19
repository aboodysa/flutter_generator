// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/usecases/create_pick.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/usecases/list_picks.dart';
import 'package:rasheed_replica_choice_demo/core/no_params.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/usecases/update_pick.dart';

enum PickListStatus { initial, loading, success, failure }

class PickListState extends Equatable {
  final PickListStatus status;
  final List<Pick> picks;
  final String? errorMessage;

  const PickListState({
    this.status = PickListStatus.initial,
    this.picks = const [],
    this.errorMessage,
  });

  PickListState copyWith({
    PickListStatus? status,
    List<Pick>? picks,
    String? errorMessage,
  }) => PickListState(
    status: status ?? this.status,
    picks: picks ?? this.picks,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, picks, errorMessage];
}

class PickListCubit extends Cubit<PickListState> {
  final ListPicks _listPicks;
  final CreatePick? _createPick;
  final UpdatePick? _updatePick;
  PickListCubit(this._listPicks, [this._createPick, this._updatePick]) : super(const PickListState());

  Future<void> load() async {
    emit(state.copyWith(status: PickListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listPicks.call(NoParams());
      emit(state.copyWith(status: PickListStatus.success, picks: items));
    } catch (e) {
      emit(state.copyWith(status: PickListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(Pick item) async {
    if (_createPick != null) await _createPick!.call(item);
    emit(state.copyWith(picks: [...state.picks, item]));
  }

  Future<void> update(Pick item) async {
    if (_updatePick != null) await _updatePick!.call(item);
    final idx = state.picks.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<Pick>.of(state.picks)..[idx] = item;
    emit(state.copyWith(picks: next));
  }
}
