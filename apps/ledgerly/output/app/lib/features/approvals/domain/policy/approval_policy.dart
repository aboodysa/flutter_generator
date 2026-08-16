// [generated] generator=PolicyEngineGenerator template=policy_engine.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval.dart';
import 'package:rasheed_replica_ledgerly/core/policy.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/rules/approval_rejected_warn.dart';

/// L2: every severity'd rule declared for Approval, evaluated in full (never first-match).
List<PolicyVerdict> evaluateApprovalPolicy(Approval e) {
  final verdicts = <PolicyVerdict>[];
  if (ApprovalRejectedWarn().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: 'ApprovalRejectedWarn',
      severity: PolicySeverity.warn,
      message: 'A rejected approval requires the requester to be notified and the claim revised.',
    ));
  }
  return verdicts;
}
