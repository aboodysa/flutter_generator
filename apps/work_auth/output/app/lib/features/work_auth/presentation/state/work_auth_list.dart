// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/create_work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/list_work_auths.dart';
import 'package:rasheed_replica_work_auth/core/no_params.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/update_work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth.dart';

enum WorkAuthListStatus { initial, loading, success, failure }

class WorkAuthListState extends Equatable {
  final WorkAuthListStatus status;
  final List<WorkAuth> workAuths;
  final String? errorMessage;

  const WorkAuthListState({
    this.status = WorkAuthListStatus.initial,
    this.workAuths = const [],
    this.errorMessage,
  });

  WorkAuthListState copyWith({
    WorkAuthListStatus? status,
    List<WorkAuth>? workAuths,
    String? errorMessage,
  }) => WorkAuthListState(
    status: status ?? this.status,
    workAuths: workAuths ?? this.workAuths,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, workAuths, errorMessage];
}

class WorkAuthListCubit extends Cubit<WorkAuthListState> {
  final ListWorkAuths _listWorkAuths;
  final CreateWorkAuth? _createWorkAuth;
  final UpdateWorkAuth? _updateWorkAuth;
  WorkAuthListCubit(this._listWorkAuths, [this._createWorkAuth, this._updateWorkAuth]) : super(const WorkAuthListState());

  Future<void> load() async {
    emit(state.copyWith(status: WorkAuthListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listWorkAuths.call(NoParams());
      emit(state.copyWith(status: WorkAuthListStatus.success, workAuths: items));
    } catch (e) {
      emit(state.copyWith(status: WorkAuthListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(WorkAuth item) async {
    if (_createWorkAuth != null) await _createWorkAuth!.call(item);
    emit(state.copyWith(workAuths: [...state.workAuths, item]));
  }

  Future<void> update(WorkAuth item) async {
    if (_updateWorkAuth != null) await _updateWorkAuth!.call(item);
    final idx = state.workAuths.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<WorkAuth>.of(state.workAuths)..[idx] = item;
    emit(state.copyWith(workAuths: next));
  }
}
