// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/follow_up.dart';

class FollowUpModel {
  const FollowUpModel({
    required this.id,
    required this.taskId,
    required this.note,
    this.createdAt,
  });

  final String id;
  final String taskId;
  final String note;
  final DateTime? createdAt;

  factory FollowUpModel.fromJson(Map<String, dynamic> json) => FollowUpModel(
      id: json['id'] as String,
      taskId: json['taskId'] as String,
      note: json['note'] as String,
      createdAt: (json['createdAt'] as String?) != null ? DateTime.parse(json['createdAt'] as String) : null,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'taskId': taskId,
      'note': note,
      'createdAt': createdAt?.toIso8601String(),
  };

  FollowUp toEntity() => FollowUp(
    id: id,
    taskId: taskId,
    note: note,
    createdAt: createdAt,
  );

  factory FollowUpModel.fromEntity(FollowUp e) => FollowUpModel(
    id: e.id,
    taskId: e.taskId,
    note: e.note,
    createdAt: e.createdAt,
  );
}
