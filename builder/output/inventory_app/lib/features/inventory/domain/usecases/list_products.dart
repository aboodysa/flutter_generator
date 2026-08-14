// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/product.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/product_filter.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/repositories/product_repository.dart';

class ListProducts {
  final ProductRepository repository;
  const ListProducts(this.repository);

  Future<List<Product>> call(ProductFilter params) => repository.listProducts(params);
}
