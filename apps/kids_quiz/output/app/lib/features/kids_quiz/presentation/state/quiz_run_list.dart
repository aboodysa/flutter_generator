// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/create_quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/list_quiz_runs.dart';
import 'package:rasheed_replica_kids_quiz/core/no_params.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/update_quiz_run.dart';

enum QuizRunListStatus { initial, loading, success, failure }

class QuizRunListState extends Equatable {
  final QuizRunListStatus status;
  final List<QuizRun> quizRuns;
  final String? errorMessage;

  const QuizRunListState({
    this.status = QuizRunListStatus.initial,
    this.quizRuns = const [],
    this.errorMessage,
  });

  QuizRunListState copyWith({
    QuizRunListStatus? status,
    List<QuizRun>? quizRuns,
    String? errorMessage,
  }) => QuizRunListState(
    status: status ?? this.status,
    quizRuns: quizRuns ?? this.quizRuns,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, quizRuns, errorMessage];
}

class QuizRunListCubit extends Cubit<QuizRunListState> {
  final ListQuizRuns _listQuizRuns;
  final CreateQuizRun? _createQuizRun;
  final UpdateQuizRun? _updateQuizRun;
  QuizRunListCubit(this._listQuizRuns, [this._createQuizRun, this._updateQuizRun]) : super(const QuizRunListState());

  Future<void> load() async {
    emit(state.copyWith(status: QuizRunListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listQuizRuns.call(NoParams());
      emit(state.copyWith(status: QuizRunListStatus.success, quizRuns: items));
    } catch (e) {
      emit(state.copyWith(status: QuizRunListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(QuizRun item) async {
    if (_createQuizRun != null) await _createQuizRun!.call(item);
    emit(state.copyWith(quizRuns: [...state.quizRuns, item]));
  }

  Future<void> update(QuizRun item) async {
    if (_updateQuizRun != null) await _updateQuizRun!.call(item);
    final idx = state.quizRuns.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<QuizRun>.of(state.quizRuns)..[idx] = item;
    emit(state.copyWith(quizRuns: next));
  }
}
