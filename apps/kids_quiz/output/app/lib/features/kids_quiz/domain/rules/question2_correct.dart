// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: Question2Correct
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';

class Question2Correct {
  bool evaluate(QuizRun e) {
    return e.q2Answer == CorrectOption.a;
  }
}
