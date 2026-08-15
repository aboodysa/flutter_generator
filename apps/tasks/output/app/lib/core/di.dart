// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_tasks/features/tasks/data/repositories/task_repository_in_memory_impl.dart';
import 'package:rasheed_replica_tasks/features/tasks/data/repositories/follow_up_repository_in_memory_impl.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/repositories/task_repository.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/repositories/follow_up_repository.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/list_tasks.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/get_task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/create_task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/update_task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/delete_task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/list_follow_ups.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/get_follow_up.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/create_follow_up.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/update_follow_up.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/delete_follow_up.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/task_list.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/follow_up_list.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<TaskRepository>(() => TaskRepositoryInMemoryImpl());
  sl.registerLazySingleton<FollowUpRepository>(() => FollowUpRepositoryInMemoryImpl());
  sl.registerLazySingleton<ListTasks>(() => ListTasks(sl<TaskRepository>()));
  sl.registerLazySingleton<GetTask>(() => GetTask(sl<TaskRepository>()));
  sl.registerLazySingleton<CreateTask>(() => CreateTask(sl<TaskRepository>()));
  sl.registerLazySingleton<UpdateTask>(() => UpdateTask(sl<TaskRepository>()));
  sl.registerLazySingleton<DeleteTask>(() => DeleteTask(sl<TaskRepository>()));
  sl.registerLazySingleton<ListFollowUps>(() => ListFollowUps(sl<FollowUpRepository>()));
  sl.registerLazySingleton<GetFollowUp>(() => GetFollowUp(sl<FollowUpRepository>()));
  sl.registerLazySingleton<CreateFollowUp>(() => CreateFollowUp(sl<FollowUpRepository>()));
  sl.registerLazySingleton<UpdateFollowUp>(() => UpdateFollowUp(sl<FollowUpRepository>()));
  sl.registerLazySingleton<DeleteFollowUp>(() => DeleteFollowUp(sl<FollowUpRepository>()));
  sl.registerFactory<TaskListCubit>(() => TaskListCubit(sl<ListTasks>(), sl<CreateTask>(), sl<UpdateTask>(), sl<DeleteTask>()));
  sl.registerFactory<FollowUpListCubit>(() => FollowUpListCubit(sl<ListFollowUps>(), sl<CreateFollowUp>(), sl<UpdateFollowUp>(), sl<DeleteFollowUp>()));
}
