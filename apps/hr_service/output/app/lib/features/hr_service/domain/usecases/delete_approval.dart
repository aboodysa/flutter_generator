// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/approval_repository.dart';

class DeleteApproval {
  final ApprovalRepository repository;
  const DeleteApproval(this.repository);

  Future<void> call(String params) => repository.deleteApproval(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
