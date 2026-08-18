// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_keemart/generated.dart';

void main() {
  test('ProductModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'title': 'x',
        'price': {'minorUnits': 0, 'currency': 'SAR'},
        'status': 'inStock',
        'oldPrice': null,
    };
    final m = ProductModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('Product equality by identity', () {
    final a = Product(id: 'x', title: 'x', price: Money(minorUnits: 0, currency: 'SAR'), status: InStockStatus.values.first);
    expect(a, equals(a));
  });
}
