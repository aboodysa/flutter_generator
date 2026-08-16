// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/usecases/list_approvals.dart';
import 'package:rasheed_replica_ledgerly/core/no_params.dart';

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
  ApprovalListCubit(this._listApprovals) : super(const ApprovalListState());

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
}
