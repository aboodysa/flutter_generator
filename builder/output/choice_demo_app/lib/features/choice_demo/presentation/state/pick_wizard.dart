// [generated] generator=StateGenerator template=state_wizard.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/answer_option.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/usecases/create_pick.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/mood_option.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';

enum PickWizardStatus { initial, loading, success, failure }

class PickWizardState extends Equatable {
  final PickWizardStatus wizardStatus;
  final int currentStep;
  final AnswerOption? answer;
  final String? errorMessage;

  const PickWizardState({
    this.wizardStatus = PickWizardStatus.initial,
    this.currentStep = 0,
    this.answer,
    this.errorMessage,
  });

  PickWizardState copyWith({
    PickWizardStatus? wizardStatus,
    int? currentStep,
    AnswerOption? answer,
    String? errorMessage,
  }) => PickWizardState(
    wizardStatus: wizardStatus ?? this.wizardStatus,
    currentStep: currentStep ?? this.currentStep,
    answer: answer ?? this.answer,
    errorMessage: errorMessage,
  );

  bool get canAdvance => switch (currentStep) {
      0 => answer != null,
      1 => true,
      _ => true,
    };

  bool get isLastStep => currentStep >= 1;

  @override
  List<Object?> get props => [wizardStatus, currentStep, answer, errorMessage];
}

class PickWizardCubit extends Cubit<PickWizardState> {
  final CreatePick? _createPick;
  PickWizardCubit([this._createPick]) : super(const PickWizardState());

  // No-op: a wizard has nothing to fetch, but main.dart/test.ts's bloc bootstrap
  // unconditionally calls `sl<XCubit>()..load()` for every screen's state.
  Future<void> load() async {}

  void next() {
    if (!state.canAdvance) return;
    final n = (state.currentStep < 1 ? state.currentStep + 1 : null);
    if (n != null) emit(state.copyWith(currentStep: n));
  }

  void back() {
    final p = (state.currentStep > 0 ? state.currentStep - 1 : null);
    if (p != null) emit(state.copyWith(currentStep: p));
  }

  void jumpTo(int i) {
    if (i < 0 || i > 1) return;
    emit(state.copyWith(currentStep: i));
  }

  Future<void> finish() async {
    if (!state.canAdvance) return;
    final result = Pick(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        label: 'x',
        answer: state.answer ?? AnswerOption.values.first,
        mood: MoodOption.values.first,
      );
    if (_createPick != null) await _createPick!.call(result);
    emit(state.copyWith(wizardStatus: PickWizardStatus.success));
  }

  void setAnswer(AnswerOption? value) => emit(state.copyWith(answer: value));
}
