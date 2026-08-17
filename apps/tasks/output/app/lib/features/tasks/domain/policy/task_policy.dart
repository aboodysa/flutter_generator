// [generated] generator=PolicyEngineGenerator template=policy_engine.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/task.dart';
import 'package:rasheed_replica_tasks/core/policy.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/rules/high_priority.dart';

/// L2: every severity'd rule declared for Task, evaluated in full (never first-match).
List<PolicyVerdict> evaluateTaskPolicy(Task e) {
  final verdicts = <PolicyVerdict>[];
  if (HighPriority().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'HighPriority',
      severity: PolicySeverity.block,
      message: 'High-priority tasks require manager sign-off before creation.',
    ));
  }
  return verdicts;
}
