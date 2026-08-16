// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/leave_request_repository.dart';
import 'package:rasheed_replica_hr_service/core/no_params.dart';

class ListLeaveRequests {
  final LeaveRequestRepository repository;
  const ListLeaveRequests(this.repository);

  Future<List<LeaveRequest>> call(NoParams params) => repository.listLeaveRequests();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
