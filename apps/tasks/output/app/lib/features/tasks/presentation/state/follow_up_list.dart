// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/create_follow_up.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/delete_follow_up.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/follow_up.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/list_follow_ups.dart';
import 'package:rasheed_replica_tasks/core/no_params.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/update_follow_up.dart';

enum FollowUpListStatus { initial, loading, success, failure }

class FollowUpListState extends Equatable {
  final FollowUpListStatus status;
  final List<FollowUp> followUps;
  final String? errorMessage;

  const FollowUpListState({
    this.status = FollowUpListStatus.initial,
    this.followUps = const [],
    this.errorMessage,
  });

  FollowUpListState copyWith({
    FollowUpListStatus? status,
    List<FollowUp>? followUps,
    String? errorMessage,
  }) => FollowUpListState(
    status: status ?? this.status,
    followUps: followUps ?? this.followUps,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, followUps, errorMessage];
}

class FollowUpListCubit extends Cubit<FollowUpListState> {
  final ListFollowUps _listFollowUps;
  final CreateFollowUp? _createFollowUp;
  final UpdateFollowUp? _updateFollowUp;
  final DeleteFollowUp? _deleteFollowUp;
  FollowUpListCubit(this._listFollowUps, [this._createFollowUp, this._updateFollowUp, this._deleteFollowUp]) : super(const FollowUpListState());

  Future<void> load() async {
    emit(state.copyWith(status: FollowUpListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listFollowUps.call(NoParams());
      emit(state.copyWith(status: FollowUpListStatus.success, followUps: items));
    } catch (e) {
      emit(state.copyWith(status: FollowUpListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(FollowUp item) async {
    if (_createFollowUp != null) await _createFollowUp!.call(item);
    emit(state.copyWith(followUps: [...state.followUps, item]));
  }

  Future<void> update(FollowUp item) async {
    if (_updateFollowUp != null) await _updateFollowUp!.call(item);
    final idx = state.followUps.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<FollowUp>.of(state.followUps)..[idx] = item;
    emit(state.copyWith(followUps: next));
  }

  Future<void> delete(String id) async {
    if (_deleteFollowUp != null) await _deleteFollowUp!.call(id);
    emit(state.copyWith(followUps: state.followUps.where((e) => e.id != id).toList()));
  }
}
