// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: ApprovalRejectedWarn
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval_decision.dart';

class ApprovalRejectedWarn {
  bool evaluate(Approval e) {
    return e.decision == ApprovalDecision.rejected;
  }
}
