// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: Question3Correct
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';

class Question3Correct {
  bool evaluate(QuizRun e) {
    return e.q3Answer == CorrectOption.b;
  }
}
