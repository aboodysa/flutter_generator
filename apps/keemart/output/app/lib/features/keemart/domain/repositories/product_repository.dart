// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_keemart/features/keemart/domain/entities/product.dart';

abstract interface class ProductRepository {
  Future<List<Product>> listProducts();
}
