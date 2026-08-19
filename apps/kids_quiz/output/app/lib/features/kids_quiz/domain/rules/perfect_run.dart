// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: PerfectRun
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/correct_option.dart';

class PerfectRun {
  bool evaluate(QuizRun e) {
    return e.q1Answer == CorrectOption.b &&
        e.q2Answer == CorrectOption.a &&
        e.q3Answer == CorrectOption.b;
  }
}
