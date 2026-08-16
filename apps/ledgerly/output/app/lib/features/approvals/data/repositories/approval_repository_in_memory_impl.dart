// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_ledgerly/features/approvals/domain/repositories/approval_repository.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval_decision.dart';

class ApprovalRepositoryInMemoryImpl implements ApprovalRepository {
  final List<Approval> _items = [Approval(id: 'x', name: 'Sample Approval', decision: ApprovalDecision.values.first), Approval(id: 'approval-1', name: 'Sample Approval 1', decision: ApprovalDecision.values.first), Approval(id: 'approval-2', name: 'Sample Approval 2', decision: ApprovalDecision.values.first)];

  @override
  Future<List<Approval>> listApprovals() async => List.unmodifiable(_items);

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
