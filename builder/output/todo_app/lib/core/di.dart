// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/domain/usecases/list_tasks.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/domain/repositories/task_repository.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/domain/usecases/create_task.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/domain/usecases/update_task.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/presentation/state/task_list.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<ListTasks>(() => ListTasks(sl<TaskRepository>()));
  sl.registerLazySingleton<CreateTask>(() => CreateTask(sl<TaskRepository>()));
  sl.registerLazySingleton<UpdateTask>(() => UpdateTask(sl<TaskRepository>()));
  sl.registerFactory<TaskListCubit>(() => TaskListCubit());
}
