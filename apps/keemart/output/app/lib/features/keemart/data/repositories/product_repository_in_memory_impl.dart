// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_keemart/features/keemart/domain/repositories/product_repository.dart';
import 'package:rasheed_replica_keemart/features/keemart/domain/entities/in_stock_status.dart';
import 'package:rasheed_replica_keemart/core/money.dart';
import 'package:rasheed_replica_keemart/features/keemart/domain/entities/product.dart';

class ProductRepositoryInMemoryImpl implements ProductRepository {
  final List<Product> _items = [Product(id: 'x', title: 'Sample Product', price: Money(minorUnits: 0, currency: 'SAR'), status: InStockStatus.values.first), Product(id: 'product-1', title: 'Sample Product 1', price: Money(minorUnits: 15000, currency: 'SAR'), oldPrice: Money(minorUnits: 15000, currency: 'SAR'), status: InStockStatus.values.first), Product(id: 'product-2', title: 'Sample Product 2', price: Money(minorUnits: 25000, currency: 'SAR'), oldPrice: Money(minorUnits: 25000, currency: 'SAR'), status: InStockStatus.values.first)];

  @override
  Future<List<Product>> listProducts() async => List.unmodifiable(_items);

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
