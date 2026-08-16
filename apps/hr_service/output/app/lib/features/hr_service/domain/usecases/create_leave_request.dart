// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/leave_request_repository.dart';

class CreateLeaveRequest {
  final LeaveRequestRepository repository;
  const CreateLeaveRequest(this.repository);

  Future<LeaveRequest> call(LeaveRequest params) => repository.createLeaveRequest(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
