// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/create_leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/delete_leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/list_leave_requests.dart';
import 'package:rasheed_replica_hr_service/core/no_params.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/update_leave_request.dart';

enum LeaveRequestListStatus { initial, loading, success, failure }

class LeaveRequestListState extends Equatable {
  final LeaveRequestListStatus status;
  final List<LeaveRequest> leaveRequests;
  final String? errorMessage;

  const LeaveRequestListState({
    this.status = LeaveRequestListStatus.initial,
    this.leaveRequests = const [],
    this.errorMessage,
  });

  LeaveRequestListState copyWith({
    LeaveRequestListStatus? status,
    List<LeaveRequest>? leaveRequests,
    String? errorMessage,
  }) => LeaveRequestListState(
    status: status ?? this.status,
    leaveRequests: leaveRequests ?? this.leaveRequests,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, leaveRequests, errorMessage];
}

class LeaveRequestListCubit extends Cubit<LeaveRequestListState> {
  final ListLeaveRequests _listLeaveRequests;
  final CreateLeaveRequest? _createLeaveRequest;
  final UpdateLeaveRequest? _updateLeaveRequest;
  final DeleteLeaveRequest? _deleteLeaveRequest;
  LeaveRequestListCubit(this._listLeaveRequests, [this._createLeaveRequest, this._updateLeaveRequest, this._deleteLeaveRequest]) : super(const LeaveRequestListState());

  Future<void> load() async {
    emit(state.copyWith(status: LeaveRequestListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listLeaveRequests.call(NoParams());
      emit(state.copyWith(status: LeaveRequestListStatus.success, leaveRequests: items));
    } catch (e) {
      emit(state.copyWith(status: LeaveRequestListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(LeaveRequest item) async {
    if (_createLeaveRequest != null) await _createLeaveRequest!.call(item);
    emit(state.copyWith(leaveRequests: [...state.leaveRequests, item]));
  }

  Future<void> update(LeaveRequest item) async {
    if (_updateLeaveRequest != null) await _updateLeaveRequest!.call(item);
    final idx = state.leaveRequests.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<LeaveRequest>.of(state.leaveRequests)..[idx] = item;
    emit(state.copyWith(leaveRequests: next));
  }

  Future<void> delete(String id) async {
    if (_deleteLeaveRequest != null) await _deleteLeaveRequest!.call(id);
    emit(state.copyWith(leaveRequests: state.leaveRequests.where((e) => e.id != id).toList()));
  }
}
