// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/leave_request_repository.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_status.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_type.dart';

class LeaveRequestRepositoryInMemoryImpl implements LeaveRequestRepository {
  final List<LeaveRequest> _items = [LeaveRequest(id: 'x', name: 'Sample LeaveRequest', leaveType: LeaveType.values.first, startDate: DateTime(2024), endDate: DateTime(2024), days: 0, status: LeaveStatus.values.first), LeaveRequest(id: 'leave-request-1', name: 'Sample LeaveRequest 1', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 1, status: LeaveStatus.values.first, reason: 'Sample item 1'), LeaveRequest(id: 'leave-request-2', name: 'Sample LeaveRequest 2', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 2, status: LeaveStatus.values.first, reason: 'Sample item 2')];

  @override
  Future<List<LeaveRequest>> listLeaveRequests() async => List.unmodifiable(_items);

  @override
  Future<LeaveRequest> getLeaveRequest(String id) async =>
      _items.firstWhere((e) => e.id == id, orElse: () => _items.first);

  @override
  Future<LeaveRequest> createLeaveRequest(LeaveRequest leaveRequest) async {
    _items.add(leaveRequest);
    return leaveRequest;
  }

  @override
  Future<void> updateLeaveRequest(LeaveRequest leaveRequest) async {
    final idx = _items.indexWhere((e) => e.id == leaveRequest.id);
    if (idx != -1) _items[idx] = leaveRequest;
  }

  @override
  Future<void> deleteLeaveRequest(String id) async {
    _items.removeWhere((e) => e.id == id);
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
