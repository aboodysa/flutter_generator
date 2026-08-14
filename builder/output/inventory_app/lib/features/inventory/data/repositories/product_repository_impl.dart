// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR. The [user] region below is user-owned.
import 'package:rasheed_replica_inventory/features/inventory/domain/repositories/product_repository.dart';
import 'package:rasheed_replica_inventory/features/inventory/data/datasources/product_remote_data_source.dart';

class ProductRepositoryImpl implements ProductRepository {
  final ProductRemoteDataSource datasource;
  const ProductRepositoryImpl(this.datasource);

  // [user] region:user — implement each ProductRepository method by delegating to datasource + mapping DTO → entity.
  @override
  // noSuchMethod to satisfy the interface until [user] regions are filled:
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
