// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/approval.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/create_approval.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/delete_approval.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/list_approvals.dart';
import 'package:rasheed_replica_hr_service/core/no_params.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/usecases/update_approval.dart';

enum ApprovalListStatus { initial, loading, success, failure }

class ApprovalListState extends Equatable {
  final ApprovalListStatus status;
  final List<Approval> approvals;
  final String? errorMessage;

  const ApprovalListState({
    this.status = ApprovalListStatus.initial,
    this.approvals = const [],
    this.errorMessage,
  });

  ApprovalListState copyWith({
    ApprovalListStatus? status,
    List<Approval>? approvals,
    String? errorMessage,
  }) => ApprovalListState(
    status: status ?? this.status,
    approvals: approvals ?? this.approvals,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, approvals, errorMessage];
}

class ApprovalListCubit extends Cubit<ApprovalListState> {
  final ListApprovals _listApprovals;
  final CreateApproval? _createApproval;
  final UpdateApproval? _updateApproval;
  final DeleteApproval? _deleteApproval;
  ApprovalListCubit(this._listApprovals, [this._createApproval, this._updateApproval, this._deleteApproval]) : super(const ApprovalListState());

  Future<void> load() async {
    emit(state.copyWith(status: ApprovalListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listApprovals.call(NoParams());
      emit(state.copyWith(status: ApprovalListStatus.success, approvals: items));
    } catch (e) {
      emit(state.copyWith(status: ApprovalListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(Approval item) async {
    if (_createApproval != null) await _createApproval!.call(item);
    emit(state.copyWith(approvals: [...state.approvals, item]));
  }

  Future<void> update(Approval item) async {
    if (_updateApproval != null) await _updateApproval!.call(item);
    final idx = state.approvals.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<Approval>.of(state.approvals)..[idx] = item;
    emit(state.copyWith(approvals: next));
  }

  Future<void> delete(String id) async {
    if (_deleteApproval != null) await _deleteApproval!.call(id);
    emit(state.copyWith(approvals: state.approvals.where((e) => e.id != id).toList()));
  }
}
