// [generated] generator=StateGenerator template=state_wizard.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/create_quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/rules/perfect_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_category.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/run_status.dart';

enum QuizRunWizardStatus { initial, loading, success, failure }

class QuizRunWizardState extends Equatable {
  final QuizRunWizardStatus wizardStatus;
  final int currentStep;
  final String? playerName;
  final CorrectOption? q1Answer;
  final CorrectOption? q2Answer;
  final CorrectOption? q3Answer;
  final String? errorMessage;

  const QuizRunWizardState({
    this.wizardStatus = QuizRunWizardStatus.initial,
    this.currentStep = 0,
    this.playerName,
    this.q1Answer,
    this.q2Answer,
    this.q3Answer,
    this.errorMessage,
  });

  QuizRunWizardState copyWith({
    QuizRunWizardStatus? wizardStatus,
    int? currentStep,
    String? playerName,
    CorrectOption? q1Answer,
    CorrectOption? q2Answer,
    CorrectOption? q3Answer,
    String? errorMessage,
  }) => QuizRunWizardState(
    wizardStatus: wizardStatus ?? this.wizardStatus,
    currentStep: currentStep ?? this.currentStep,
    playerName: playerName ?? this.playerName,
    q1Answer: q1Answer ?? this.q1Answer,
    q2Answer: q2Answer ?? this.q2Answer,
    q3Answer: q3Answer ?? this.q3Answer,
    errorMessage: errorMessage,
  );

  QuizRun get _draft => QuizRun(
      id: 'x',
      playerName: playerName ?? 'x',
      category: QuizCategory.values.first,
      q1Answer: q1Answer ?? CorrectOption.values.first,
      q2Answer: q2Answer ?? CorrectOption.values.first,
      q3Answer: q3Answer ?? CorrectOption.values.first,
      status: RunStatus.values.first,
      );

  QuizRun get draft => _draft;

  bool get canAdvance => switch (currentStep) {
      0 => (playerName != null && playerName!.isNotEmpty),
      1 => q1Answer != null,
      2 => q2Answer != null,
      3 => q3Answer != null,
      4 => true,
      5 => true,
      _ => true,
    };

  bool _isVisible(int i) => switch (i) {
      0 => true,
      1 => true,
      2 => true,
      3 => true,
      4 => PerfectRun().evaluate(_draft),
      5 => true,
      _ => false,
    };

  int? get _nextVisibleStep {
    for (var i = currentStep + 1; i <= 5; i++) {
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
  List<Object?> get props => [wizardStatus, currentStep, playerName, q1Answer, q2Answer, q3Answer, errorMessage];
}

class QuizRunWizardCubit extends Cubit<QuizRunWizardState> {
  final CreateQuizRun? _createQuizRun;
  QuizRunWizardCubit([this._createQuizRun]) : super(const QuizRunWizardState());

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
    if (i < 0 || i > 5) return;
    if (!state._isVisible(i)) return;
    emit(state.copyWith(currentStep: i));
  }

  Future<void> finish() async {
    if (!state.canAdvance) return;
    final result = QuizRun(
        id: DateTime.now().millisecondsSinceEpoch.toString(),
        playerName: state.playerName ?? 'x',
        category: QuizCategory.values.first,
        q1Answer: state.q1Answer ?? CorrectOption.values.first,
        q2Answer: state.q2Answer ?? CorrectOption.values.first,
        q3Answer: state.q3Answer ?? CorrectOption.values.first,
        status: RunStatus.values.first,
      );
    if (_createQuizRun != null) await _createQuizRun!.call(result);
    emit(state.copyWith(wizardStatus: QuizRunWizardStatus.success));
  }

  void setPlayerName(String? value) => emit(state.copyWith(playerName: value));

  void setQ1Answer(CorrectOption? value) => emit(state.copyWith(q1Answer: value));

  void setQ2Answer(CorrectOption? value) => emit(state.copyWith(q2Answer: value));

  void setQ3Answer(CorrectOption? value) => emit(state.copyWith(q3Answer: value));
}
