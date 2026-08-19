// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/data/repositories/pick_repository_in_memory_impl.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/repositories/pick_repository.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/usecases/list_picks.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/usecases/create_pick.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/usecases/update_pick.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/presentation/state/pick_list.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/presentation/state/pick_wizard.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<PickRepository>(() => PickRepositoryInMemoryImpl());
  sl.registerLazySingleton<ListPicks>(() => ListPicks(sl<PickRepository>()));
  sl.registerLazySingleton<CreatePick>(() => CreatePick(sl<PickRepository>()));
  sl.registerLazySingleton<UpdatePick>(() => UpdatePick(sl<PickRepository>()));
  sl.registerFactory<PickListCubit>(() => PickListCubit(sl<ListPicks>(), sl<CreatePick>(), sl<UpdatePick>()));
  sl.registerFactory<PickWizardCubit>(() => PickWizardCubit(sl<CreatePick>()));
}
