// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval_decision.dart';

class Approval extends Equatable {
  const Approval({
    required this.id,
    required this.name,
    required this.decision,
  });

  final String id;
  final String name;
  final ApprovalDecision decision;

  @override
  List<Object?> get props => [id];
}
