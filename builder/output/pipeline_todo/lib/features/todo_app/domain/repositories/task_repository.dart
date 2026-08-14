// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_todo_app/features/todo_app/domain/entities/task.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/domain/entities/task_filter.dart';

abstract interface class TaskRepository {
  Future<List<Task>> listTasks({TaskFilter filter});
  Future<Task> createTask(Task task);
  Future<void> updateTask(Task task);
}
