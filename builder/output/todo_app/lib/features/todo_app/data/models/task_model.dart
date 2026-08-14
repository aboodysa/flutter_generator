// [generated] generator=ModelGenerator template=model.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_todo_app/features/todo_app/domain/entities/priority.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/domain/entities/task.dart';

class TaskModel {
  const TaskModel({
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

  factory TaskModel.fromJson(Map<String, dynamic> json) => TaskModel(
      id: json['id'] as String,
      title: json['title'] as String,
      description: json['description'] as String?,
      dueDate: (json['dueDate'] as String?) != null ? DateTime.parse(json['dueDate'] as String) : null,
      priority: Priority.values.byName(json['priority'] as String),
      isDone: json['isDone'] as bool? ?? false,
  );

  Map<String, dynamic> toJson() => <String, dynamic>{
      'id': id,
      'title': title,
      'description': description,
      'dueDate': dueDate?.toIso8601String(),
      'priority': priority.name,
      'isDone': isDone,
  };

  Task toEntity() => Task(
    id: id,
    title: title,
    description: description,
    dueDate: dueDate,
    priority: priority,
    isDone: isDone,
  );

  factory TaskModel.fromEntity(Task e) => TaskModel(
    id: e.id,
    title: e.title,
    description: e.description,
    dueDate: e.dueDate,
    priority: e.priority,
    isDone: e.isDone,
  );
}
