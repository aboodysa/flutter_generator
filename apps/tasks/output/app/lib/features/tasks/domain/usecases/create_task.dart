// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/repositories/task_repository.dart';

class CreateTask {
  final TaskRepository repository;
  const CreateTask(this.repository);

  Future<Task> call(Task params) => repository.createTask(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
