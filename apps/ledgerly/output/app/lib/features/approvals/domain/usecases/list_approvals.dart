// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/repositories/approval_repository.dart';
import 'package:rasheed_replica_ledgerly/core/no_params.dart';

class ListApprovals {
  final ApprovalRepository repository;
  const ListApprovals(this.repository);

  Future<List<Approval>> call(NoParams params) => repository.listApprovals();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
