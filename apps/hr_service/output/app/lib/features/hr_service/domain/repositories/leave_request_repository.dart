// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';

abstract interface class LeaveRequestRepository {
  Future<List<LeaveRequest>> listLeaveRequests();
  Future<LeaveRequest> getLeaveRequest(String id);
  Future<LeaveRequest> createLeaveRequest(LeaveRequest leaveRequest);
  Future<void> updateLeaveRequest(LeaveRequest leaveRequest);
  Future<void> deleteLeaveRequest(String id);
}
