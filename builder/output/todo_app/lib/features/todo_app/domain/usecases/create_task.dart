// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_todo_app/features/todo_app/domain/entities/task.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/domain/repositories/task_repository.dart';

class CreateTask {
  final TaskRepository repository;
  const CreateTask(this.repository);

  Future<Task> call(Task params) => repository.createTask(params);
}
