// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval.dart';

abstract interface class ApprovalRepository {
  Future<List<Approval>> listApprovals();
  Future<void> updateApproval(Approval approval);
}
