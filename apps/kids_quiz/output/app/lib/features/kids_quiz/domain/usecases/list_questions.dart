// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_kids_quiz/core/no_params.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/question.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/question_repository.dart';

class ListQuestions {
  final QuestionRepository repository;
  const ListQuestions(this.repository);

  Future<List<Question>> call(NoParams params) => repository.listQuestions();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
