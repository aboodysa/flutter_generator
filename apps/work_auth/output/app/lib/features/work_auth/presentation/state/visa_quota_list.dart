// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/create_visa_quota.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/delete_visa_quota.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/list_visa_quotas.dart';
import 'package:rasheed_replica_work_auth/core/no_params.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/update_visa_quota.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/visa_quota.dart';

enum VisaQuotaListStatus { initial, loading, success, failure }

class VisaQuotaListState extends Equatable {
  final VisaQuotaListStatus status;
  final List<VisaQuota> visaQuotas;
  final String? errorMessage;

  const VisaQuotaListState({
    this.status = VisaQuotaListStatus.initial,
    this.visaQuotas = const [],
    this.errorMessage,
  });

  VisaQuotaListState copyWith({
    VisaQuotaListStatus? status,
    List<VisaQuota>? visaQuotas,
    String? errorMessage,
  }) => VisaQuotaListState(
    status: status ?? this.status,
    visaQuotas: visaQuotas ?? this.visaQuotas,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, visaQuotas, errorMessage];
}

class VisaQuotaListCubit extends Cubit<VisaQuotaListState> {
  final ListVisaQuotas _listVisaQuotas;
  final CreateVisaQuota? _createVisaQuota;
  final UpdateVisaQuota? _updateVisaQuota;
  final DeleteVisaQuota? _deleteVisaQuota;
  VisaQuotaListCubit(this._listVisaQuotas, [this._createVisaQuota, this._updateVisaQuota, this._deleteVisaQuota]) : super(const VisaQuotaListState());

  Future<void> load() async {
    emit(state.copyWith(status: VisaQuotaListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listVisaQuotas.call(NoParams());
      emit(state.copyWith(status: VisaQuotaListStatus.success, visaQuotas: items));
    } catch (e) {
      emit(state.copyWith(status: VisaQuotaListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(VisaQuota item) async {
    if (_createVisaQuota != null) await _createVisaQuota!.call(item);
    emit(state.copyWith(visaQuotas: [...state.visaQuotas, item]));
  }

  Future<void> update(VisaQuota item) async {
    if (_updateVisaQuota != null) await _updateVisaQuota!.call(item);
    final idx = state.visaQuotas.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<VisaQuota>.of(state.visaQuotas)..[idx] = item;
    emit(state.copyWith(visaQuotas: next));
  }

  Future<void> delete(String id) async {
    if (_deleteVisaQuota != null) await _deleteVisaQuota!.call(id);
    emit(state.copyWith(visaQuotas: state.visaQuotas.where((e) => e.id != id).toList()));
  }
}
