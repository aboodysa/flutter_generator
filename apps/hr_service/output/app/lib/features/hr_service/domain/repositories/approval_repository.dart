// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/approval.dart';

abstract interface class ApprovalRepository {
  Future<List<Approval>> listApprovals();
  Future<Approval> getApproval(String id);
  Future<Approval> createApproval(Approval approval);
  Future<void> updateApproval(Approval approval);
  Future<void> deleteApproval(String id);
}
