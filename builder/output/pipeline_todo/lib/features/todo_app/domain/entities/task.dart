// [generated] generator=EntityGenerator template=entity.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';

import 'package:rasheed_replica_todo_app/features/todo_app/domain/entities/priority.dart';

class Task extends Equatable {
  const Task({
    required this.id,
    required this.title,
    this.description,
    this.dueDate,
    required this.priority,
    required this.isDone,
  });

  final String id;
  final String title;
  final String? description;
  final DateTime? dueDate;
  final Priority priority;
  final bool isDone;

  @override
  List<Object?> get props => [id];
}
