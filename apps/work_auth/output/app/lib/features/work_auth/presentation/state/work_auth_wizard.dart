// [generated] generator=StateGenerator template=state_wizard.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/create_work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/rules/needs_manager_review.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth_status.dart';

enum WorkAuthWizardStatus { initial, loading, success, failure }

class WorkAuthWizardState extends Equatable {
  final WorkAuthWizardStatus wizardStatus;
  final int currentStep;
  final String? name;
  final String? country;
  final String? jobTitle;
  final int? durationDays;
  final WorkAuthStatus? status;
  final String? errorMessage;

  const WorkAuthWizardState({
    this.wizardStatus = WorkAuthWizardStatus.initial,
    this.currentStep = 0,
    this.name,
    this.country,
    this.jobTitle,
    this.durationDays,
    this.status,
    this.errorMessage,
  });

  WorkAuthWizardState copyWith({
    WorkAuthWizardStatus? wizardStatus,
    int? currentStep,
    String? name,
    String? country,
    String? jobTitle,
    int? durationDays,
    WorkAuthStatus? status,
    String? errorMessage,
  }) => WorkAuthWizardState(
    wizardStatus: wizardStatus ?? this.wizardStatus,
    currentStep: currentStep ?? this.currentStep,
    name: name ?? this.name,
    country: country ?? this.country,
    jobTitle: jobTitle ?? this.jobTitle,
    durationDays: durationDays ?? this.durationDays,
    status: status ?? this.status,
    errorMessage: errorMessage,
  );

  WorkAuth get _draft => WorkAuth(
      id: 'x',
      name: name ?? 'x',
      country: country ?? 'x',
      jobTitle: jobTitle ?? 'x',
      startDate: DateTime(2024),
      durationDays: durationDays ?? 0,
      status: status ?? WorkAuthStatus.values.first,
      );

  bool get canAdvance => switch (currentStep) {
      0 => (name != null && name!.isNotEmpty) && (country != null && country!.isNotEmpty) && (jobTitle != null && jobTitle!.isNotEmpty) && durationDays != null,
      1 => true,
      2 => status != null,
      3 => true,
      _ => true,
    };

  bool _isVisible(int i) => switch (i) {
      0 => true,
      1 => NeedsManagerReview().evaluate(_draft),
      2 => true,
      3 => true,
      _ => false,
    };

  int? get _nextVisibleStep {
    for (var i = currentStep + 1; i <= 3; i++) {
      if (_isVisible(i)) return i;
    }
    return null;
  }

  int? get _prevVisibleStep {
    for (var i = currentStep - 1; i >= 0; i--) {
      if (_isVisible(i)) return i;
    }
    return null;
  }

  bool get isLastStep => _nextVisibleStep == null;

  @override
  List<Object?> get props => [wizardStatus, currentStep, name, country, jobTitle, durationDays, status, errorMessage];
}

class WorkAuthWizardCubit extends Cubit<WorkAuthWizardState> {
  final CreateWorkAuth? _createWorkAuth;
  WorkAuthWizardCubit([this._createWorkAuth]) : super(const WorkAuthWizardState());

  // No-op: a wizard has nothing to fetch, but main.dart/test.ts's bloc bootstrap
  // unconditionally calls `sl<XCubit>()..load()` for every screen's state.
  Future<void> load() async {}

  void next() {
    if (!state.canAdvance) return;
    final n = state._nextVisibleStep;
    if (n != null) emit(state.copyWith(currentStep: n));
  }

  void back() {
    final p = state._prevVisibleStep;
    if (p != null) emit(state.copyWith(currentStep: p));
  }

  void jumpTo(int i) {
    if (i < 0 || i > 3) return;
    if (!state._isVisible(i)) return;
    emit(state.copyWith(currentStep: i));
  }

  Future<void> finish() async {
    if (!state.canAdvance) return;
    final result = WorkAuth(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        name: state.name ?? 'x',
        country: state.country ?? 'x',
        jobTitle: state.jobTitle ?? 'x',
        startDate: DateTime(2024),
        durationDays: state.durationDays ?? 0,
        status: state.status ?? WorkAuthStatus.values.first,
      );
    if (_createWorkAuth != null) await _createWorkAuth!.call(result);
    emit(state.copyWith(wizardStatus: WorkAuthWizardStatus.success));
  }

  void setName(String? value) => emit(state.copyWith(name: value));

  void setCountry(String? value) => emit(state.copyWith(country: value));

  void setJobTitle(String? value) => emit(state.copyWith(jobTitle: value));

  void setDurationDays(int? value) => emit(state.copyWith(durationDays: value));

  void setStatus(WorkAuthStatus? value) => emit(state.copyWith(status: value));
}
