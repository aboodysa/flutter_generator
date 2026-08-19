// [generated] generator=PolicyEngineGenerator template=policy_engine.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/entities/quiz_run.dart';
import 'package:rasheed_replica_kids_quiz/core/policy.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/rules/question1_correct.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/rules/question2_correct.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/rules/question3_correct.dart';
import 'package:rasheed_replica_kids_quiz/features/kids_quiz/domain/rules/run_completed.dart';

/// L2: every severity'd rule declared for QuizRun, evaluated in full (never first-match).
List<PolicyVerdict> evaluateQuizRunPolicy(QuizRun e) {
  final verdicts = <PolicyVerdict>[];
  if (Question1Correct().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'Question1Correct',
      severity: PolicySeverity.warn,
      message: 'Correct! +5 ⭐',
    ));
  }
  if (Question2Correct().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'Question2Correct',
      severity: PolicySeverity.warn,
      message: 'Correct! +5 ⭐',
    ));
  }
  if (Question3Correct().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'Question3Correct',
      severity: PolicySeverity.warn,
      message: 'Correct! +5 ⭐',
    ));
  }
  if (RunCompleted().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'RunCompleted',
      severity: PolicySeverity.warn,
      message: 'Great job finishing the quiz! +5 ⭐',
    ));
  }
  return verdicts;
}
