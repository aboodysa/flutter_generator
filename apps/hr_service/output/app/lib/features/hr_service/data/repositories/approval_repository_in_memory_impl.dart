// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/repositories/approval_repository.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/approval.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/data/models/approval_model.dart';
import 'package:rasheed_replica_hr_service/core/outbox.dart';

class ApprovalRepositoryInMemoryImpl implements ApprovalRepository {
  final List<Approval> _items = [Approval(id: 'x', leaveRequestId: 'x', approver: 'x'), Approval(id: 'approval-1', leaveRequestId: 'Sample item 1', approver: 'Sample item 1', note: 'Sample item 1', decidedAt: DateTime(2025)), Approval(id: 'approval-2', leaveRequestId: 'Sample item 2', approver: 'Sample item 2', note: 'Sample item 2', decidedAt: DateTime(2025))];

  @override
  Future<List<Approval>> listApprovals() async => List.unmodifiable(_items);

  @override
  Future<Approval> getApproval(String id) async =>
      _items.firstWhere((e) => e.id == id, orElse: () => _items.first);

  @override
  Future<Approval> createApproval(Approval approval) async {
    Outbox.instance.enqueue(
      entity: 'Approval',
      entityId: approval.id.toString(),
      action: 'create',
      payload: ApprovalModel.fromEntity(approval).toJson(),
    );
    _items.add(approval);
    return approval;
  }

  @override
  Future<void> updateApproval(Approval approval) async {
    final idx = _items.indexWhere((e) => e.id == approval.id);
    if (idx != -1) {
      Outbox.instance.enqueue(
        entity: 'Approval',
        entityId: approval.id.toString(),
        action: 'update',
        payload: ApprovalModel.fromEntity(approval).toJson(),
      );
    }
    if (idx != -1) _items[idx] = approval;
  }

  @override
  Future<void> deleteApproval(String id) async {
    final _matches = _items.where((e) => e.id == id);
    final _existing = _matches.isEmpty ? null : _matches.first;
    if (_existing != null) {
      Outbox.instance.enqueue(entity: 'Approval', entityId: id.toString(), action: 'delete');
    }
    _items.removeWhere((e) => e.id == id);
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
