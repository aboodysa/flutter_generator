// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + ApprovalRejectedWarn.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = Approval(id: 'ap-1', name: 'Q1 travel claim', decision: ApprovalDecision.rejected);
    expect(ApprovalRejectedWarn().evaluate(e), equals(true));
  });

  test('case 2: expected false', () {
    final e = Approval(id: 'ap-2', name: 'Q2 travel claim', decision: ApprovalDecision.approved);
    expect(ApprovalRejectedWarn().evaluate(e), equals(false));
  });

  test('case 3: expected false', () {
    final e = Approval(id: 'ap-3', name: 'Q3 travel claim', decision: ApprovalDecision.pending);
    expect(ApprovalRejectedWarn().evaluate(e), equals(false));
  });
}
