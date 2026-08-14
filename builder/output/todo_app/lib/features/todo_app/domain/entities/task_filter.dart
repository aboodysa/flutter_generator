// [generated] generator=QueryGenerator template=query.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_todo_app/features/todo_app/domain/entities/priority.dart';

class TaskFilter {
  final Priority priority;
  final bool isDone;

  const TaskFilter({
    required this.priority,
    required this.isDone,
  });

  TaskFilter copyWith({
    Priority? priority,
    bool? isDone,
  }) => TaskFilter(
    priority: priority ?? this.priority,
    isDone: isDone ?? this.isDone,
  );

  Map<String, dynamic> toQueryParams() {
    final params = <String, dynamic>{};
    params['priority'] = priority;
    params['isDone'] = isDone;
    return params;
  }
}
