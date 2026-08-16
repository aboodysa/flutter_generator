// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/leave_request_repository.dart';

class DeleteLeaveRequest {
  final LeaveRequestRepository repository;
  const DeleteLeaveRequest(this.repository);

  Future<void> call(String params) => repository.deleteLeaveRequest(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
