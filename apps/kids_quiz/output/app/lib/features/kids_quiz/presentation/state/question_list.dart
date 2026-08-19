// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/usecases/list_questions.dart';
import 'package:rasheed_replica_kids_quiz/core/no_params.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/question.dart';

enum QuestionListStatus { initial, loading, success, failure }

class QuestionListState extends Equatable {
  final QuestionListStatus status;
  final List<Question> questions;
  final String? errorMessage;

  const QuestionListState({
    this.status = QuestionListStatus.initial,
    this.questions = const [],
    this.errorMessage,
  });

  QuestionListState copyWith({
    QuestionListStatus? status,
    List<Question>? questions,
    String? errorMessage,
  }) => QuestionListState(
    status: status ?? this.status,
    questions: questions ?? this.questions,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, questions, errorMessage];
}

class QuestionListCubit extends Cubit<QuestionListState> {
  final ListQuestions _listQuestions;
  QuestionListCubit(this._listQuestions) : super(const QuestionListState());

  Future<void> load() async {
    emit(state.copyWith(status: QuestionListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listQuestions.call(NoParams());
      emit(state.copyWith(status: QuestionListStatus.success, questions: items));
    } catch (e) {
      emit(state.copyWith(status: QuestionListStatus.failure, errorMessage: e.toString()));
    }
  }
}
