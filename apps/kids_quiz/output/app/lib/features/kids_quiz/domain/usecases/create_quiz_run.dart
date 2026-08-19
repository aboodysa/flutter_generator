// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/quiz_run_repository.dart';

class CreateQuizRun {
  final QuizRunRepository repository;
  const CreateQuizRun(this.repository);

  Future<QuizRun> call(QuizRun params) => repository.createQuizRun(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
