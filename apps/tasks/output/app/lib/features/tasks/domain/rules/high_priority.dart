// [generated] generator=BusinessRuleGenerator template=rule.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR. Rule: HighPriority
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/priority.dart';

class HighPriority {
  bool evaluate(Task e) {
    return e.priority == Priority.high;
  }
}
