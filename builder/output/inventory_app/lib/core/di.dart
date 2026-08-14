// [generated] generator=DIGenerator template=di_get_it.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:get_it/get_it.dart';
import 'package:dio/dio.dart';
import 'package:rasheed_replica_inventory/features/inventory/data/datasources/product_remote_data_source.dart';
import 'package:rasheed_replica_inventory/features/inventory/data/repositories/product_repository_impl.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/repositories/product_repository.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/usecases/list_products.dart';
import 'package:rasheed_replica_inventory/features/inventory/presentation/state/product_list.dart';

final sl = GetIt.instance;

void setupDependencies() {
  sl.registerLazySingleton<ProductRemoteDataSource>(() => ProductRemoteDataSource(sl<Dio>()));
  sl.registerLazySingleton<ProductRepository>(() => ProductRepositoryImpl(sl<ProductRemoteDataSource>()));
  sl.registerLazySingleton<ListProducts>(() => ListProducts(sl<ProductRepository>()));
  sl.registerFactory<ProductListCubit>(() => ProductListCubit());
}
