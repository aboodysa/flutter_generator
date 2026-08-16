// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval_decision.dart';

class ApprovalModel {
  const ApprovalModel({
    required this.id,
    required this.name,
    required this.decision,
  });

  final String id;
  final String name;
  final ApprovalDecision decision;

  factory ApprovalModel.fromJson(Map<String, dynamic> json) => ApprovalModel(
      id: json['id'] as String,
      name: json['name'] as String,
      decision: ApprovalDecision.values.byName(json['decision'] as String),
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'name': name,
      'decision': decision.name,
  };

  Approval toEntity() => Approval(
    id: id,
    name: name,
    decision: decision,
  );

  factory ApprovalModel.fromEntity(Approval e) => ApprovalModel(
    id: e.id,
    name: e.name,
    decision: e.decision,
  );
}
