// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/leave_request_repository.dart';

class GetLeaveRequest {
  final LeaveRequestRepository repository;
  const GetLeaveRequest(this.repository);

  Future<LeaveRequest> call(String params) => repository.getLeaveRequest(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
