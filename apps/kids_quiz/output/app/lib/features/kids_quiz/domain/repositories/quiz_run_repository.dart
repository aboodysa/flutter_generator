// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';

abstract interface class QuizRunRepository {
  Future<List<QuizRun>> listQuizRuns();
  Future<QuizRun> createQuizRun(QuizRun quizRun);
  Future<void> updateQuizRun(QuizRun quizRun);
}
