// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/task.dart';

abstract interface class TaskRepository {
  Future<List<Task>> listTasks();
  Future<Task> getTask(String id);
  Future<Task> createTask(Task task);
  Future<void> updateTask(Task task);
  Future<void> deleteTask(String id);
}
