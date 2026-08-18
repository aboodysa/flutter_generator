// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_keemart/core/no_params.dart';
import 'package:rasheed_replica_keemart/features/keemart/domain/entities/product.dart';
import 'package:rasheed_replica_keemart/features/keemart/domain/repositories/product_repository.dart';

class ListProducts {
  final ProductRepository repository;
  const ListProducts(this.repository);

  Future<List<Product>> call(NoParams params) => repository.listProducts();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
