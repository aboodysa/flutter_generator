// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_kids_quiz/core/no_params.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/repositories/quiz_run_repository.dart';

class ListQuizRuns {
  final QuizRunRepository repository;
  const ListQuizRuns(this.repository);

  Future<List<QuizRun>> call(NoParams params) => repository.listQuizRuns();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
