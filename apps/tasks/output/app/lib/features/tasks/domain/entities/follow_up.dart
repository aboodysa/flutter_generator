// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';


class FollowUp extends Equatable {
  const FollowUp({
    required this.id,
    required this.taskId,
    required this.subject,
    this.createdAt,
  });

  final String id;
  final String taskId;
  final String subject;
  final DateTime? createdAt;

  @override
  List<Object?> get props => [id, taskId, subject, createdAt];
}
