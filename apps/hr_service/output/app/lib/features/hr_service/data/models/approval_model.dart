// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/approval.dart';

class ApprovalModel {
  const ApprovalModel({
    required this.id,
    required this.leaveRequestId,
    required this.approver,
    this.note,
    this.decidedAt,
  });

  final String id;
  final String leaveRequestId;
  final String approver;
  final String? note;
  final DateTime? decidedAt;

  factory ApprovalModel.fromJson(Map<String, dynamic> json) => ApprovalModel(
      id: json['id'] as String,
      leaveRequestId: json['leaveRequestId'] as String,
      approver: json['approver'] as String,
      note: json['note'] as String?,
      decidedAt: (json['decidedAt'] as String?) != null ? DateTime.parse(json['decidedAt'] as String) : null,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'leaveRequestId': leaveRequestId,
      'approver': approver,
      'note': note,
      'decidedAt': decidedAt?.toIso8601String(),
  };

  Approval toEntity() => Approval(
    id: id,
    leaveRequestId: leaveRequestId,
    approver: approver,
    note: note,
    decidedAt: decidedAt,
  );

  factory ApprovalModel.fromEntity(Approval e) => ApprovalModel(
    id: e.id,
    leaveRequestId: e.leaveRequestId,
    approver: e.approver,
    note: e.note,
    decidedAt: e.decidedAt,
  );
}
