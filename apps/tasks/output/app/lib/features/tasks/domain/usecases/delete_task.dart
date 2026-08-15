// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_tasks/features/tasks/domain/repositories/task_repository.dart';

class DeleteTask {
  final TaskRepository repository;
  const DeleteTask(this.repository);

  Future<void> call(String params) => repository.deleteTask(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
