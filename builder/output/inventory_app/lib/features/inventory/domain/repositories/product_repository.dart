// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/product.dart';
import 'package:rasheed_replica_inventory/features/inventory/domain/entities/product_filter.dart';

abstract interface class ProductRepository {
  Future<List<Product>> listProducts(ProductFilter filter);
  Future<Product> getProduct(String id);
  Future<void> restock({required String productId, required int quantity});
}
