// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_keemart/features/keemart/data/repositories/product_repository_in_memory_impl.dart';
import 'package:rasheed_replica_keemart/features/keemart/domain/repositories/product_repository.dart';
import 'package:rasheed_replica_keemart/features/keemart/domain/usecases/list_products.dart';
import 'package:rasheed_replica_keemart/features/keemart/presentation/state/home.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<ProductRepository>(() => ProductRepositoryInMemoryImpl());
  sl.registerLazySingleton<ListProducts>(() => ListProducts(sl<ProductRepository>()));
  sl.registerFactory<HomeCubit>(() => HomeCubit(sl<ListProducts>()));
}
