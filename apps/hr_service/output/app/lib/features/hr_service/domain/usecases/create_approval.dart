// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/approval.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/approval_repository.dart';

class CreateApproval {
  final ApprovalRepository repository;
  const CreateApproval(this.repository);

  Future<Approval> call(Approval params) => repository.createApproval(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
