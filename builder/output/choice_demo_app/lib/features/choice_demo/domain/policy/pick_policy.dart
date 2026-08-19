// [generated] generator=PolicyEngineGenerator template=policy_engine.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';
import 'package:rasheed_replica_choice_demo/core/policy.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/rules/mood_happy.dart';

/// L2: every severity'd rule declared for Pick, evaluated in full (never first-match).
List<PolicyVerdict> evaluatePickPolicy(Pick e) {
  final verdicts = <PolicyVerdict>[];
  if (MoodHappy().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'MoodHappy',
      severity: PolicySeverity.warn,
      message: 'Feeling happy today!',
    ));
  }
  return verdicts;
}
