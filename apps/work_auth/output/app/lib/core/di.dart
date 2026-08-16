// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/data/repositories/work_auth_repository_in_memory_impl.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/repositories/work_auth_repository.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/list_work_auths.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/create_work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/usecases/update_work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/state/work_auth_list.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/state/work_auth_wizard.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<WorkAuthRepository>(() => WorkAuthRepositoryInMemoryImpl());
  sl.registerLazySingleton<ListWorkAuths>(() => ListWorkAuths(sl<WorkAuthRepository>()));
  sl.registerLazySingleton<CreateWorkAuth>(() => CreateWorkAuth(sl<WorkAuthRepository>()));
  sl.registerLazySingleton<UpdateWorkAuth>(() => UpdateWorkAuth(sl<WorkAuthRepository>()));
  sl.registerFactory<WorkAuthListCubit>(() => WorkAuthListCubit(sl<ListWorkAuths>(), sl<CreateWorkAuth>(), sl<UpdateWorkAuth>()));
  sl.registerFactory<WorkAuthWizardCubit>(() => WorkAuthWizardCubit(sl<CreateWorkAuth>()));
}
