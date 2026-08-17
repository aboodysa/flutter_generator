// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/repositories/approval_repository.dart';

class UpdateApproval {
  final ApprovalRepository repository;
  const UpdateApproval(this.repository);

  Future<void> call(Approval params) => repository.updateApproval(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
