// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/leave_request_repository.dart';
import 'package:rasheed_replica_hr_service/core/audit.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/data/models/leave_request_model.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_status.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_type.dart';
import 'package:rasheed_replica_hr_service/core/outbox.dart';
import 'package:rasheed_replica_hr_service/core/session.dart';

class LeaveRequestRepositoryInMemoryImpl implements LeaveRequestRepository {
  final List<LeaveRequest> _items = [LeaveRequest(id: 'x', name: 'Sample LeaveRequest', leaveType: LeaveType.values.first, startDate: DateTime(2024), endDate: DateTime(2024), days: 0, status: LeaveStatus.values.first, exported: false), LeaveRequest(id: 'leave-request-1', name: 'Sample LeaveRequest 1', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 1, status: LeaveStatus.values.first, reason: 'Sample item 1', exported: false), LeaveRequest(id: 'leave-request-2', name: 'Sample LeaveRequest 2', leaveType: LeaveType.values.first, startDate: DateTime(2025), endDate: DateTime(2025), days: 2, status: LeaveStatus.values.first, reason: 'Sample item 2', exported: false)];

  @override
  Future<List<LeaveRequest>> listLeaveRequests() async => List.unmodifiable(_items);

  @override
  Future<LeaveRequest> getLeaveRequest(String id) async =>
      _items.firstWhere((e) => e.id == id, orElse: () => _items.first);

  @override
  Future<LeaveRequest> createLeaveRequest(LeaveRequest leaveRequest) async {
    Outbox.instance.enqueue(
      entity: 'LeaveRequest',
      entityId: leaveRequest.id.toString(),
      action: 'create',
      payload: LeaveRequestModel.fromEntity(leaveRequest).toJson(),
    );
    _items.add(leaveRequest);
    AuditLog.instance.append(recordMutation(
      entity: 'LeaveRequest',
      entityId: leaveRequest.id.toString(),
      action: 'create',
      actor: Session.instance.actorId ?? 'system',
      after: LeaveRequestModel.fromEntity(leaveRequest).toJson(),
    ));
    return leaveRequest;
  }

  @override
  Future<void> updateLeaveRequest(LeaveRequest leaveRequest) async {
    final idx = _items.indexWhere((e) => e.id == leaveRequest.id);
    if (idx != -1 && _items[idx].exported == true) {
      throw StateError('LeaveRequest ${_items[idx].id} is exported and immutable — corrections require void + clone, not edit.');
    }
    if (idx != -1) {
      Outbox.instance.enqueue(
        entity: 'LeaveRequest',
        entityId: leaveRequest.id.toString(),
        action: 'update',
        payload: LeaveRequestModel.fromEntity(leaveRequest).toJson(),
      );
    }
    final before = idx != -1 ? LeaveRequestModel.fromEntity(_items[idx]).toJson() : null;
    if (idx != -1) _items[idx] = leaveRequest;
    if (idx != -1) {
      AuditLog.instance.append(recordMutation(
        entity: 'LeaveRequest',
        entityId: leaveRequest.id.toString(),
        action: 'update',
        actor: Session.instance.actorId ?? 'system',
        before: before,
        after: LeaveRequestModel.fromEntity(leaveRequest).toJson(),
      ));
    }
  }

  @override
  Future<void> deleteLeaveRequest(String id) async {
    final _matches = _items.where((e) => e.id == id);
    final _existing = _matches.isEmpty ? null : _matches.first;
    if (_existing != null && _existing.exported == true) {
      throw StateError('LeaveRequest ${id} is exported and immutable — corrections require void + clone, not delete.');
    }
    if (_existing != null) {
      Outbox.instance.enqueue(entity: 'LeaveRequest', entityId: id.toString(), action: 'delete');
    }
    _items.removeWhere((e) => e.id == id);
    if (_existing != null) {
      AuditLog.instance.append(recordMutation(
        entity: 'LeaveRequest',
        entityId: id.toString(),
        action: 'delete',
        actor: Session.instance.actorId ?? 'system',
        before: LeaveRequestModel.fromEntity(_existing).toJson(),
      ));
    }
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
