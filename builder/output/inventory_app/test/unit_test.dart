// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_inventory/generated.dart';

void main() {
  test('ProductModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'name': 'x',
        'sku': 'x',
        'price': 0.0,
        'quantity': 0,
        'unit': 'piece',
        'status': 'inStock',
    };
    final m = ProductModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('Product equality by identity', () {
    final a = Product(id: 'x', name: 'x', sku: 'x', price: 0.0, quantity: 0, unit: Unit.values.first, status: StockStatus.values.first);
    expect(a, equals(a));
  });
}
