// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_expense_tracker/generated.dart';

void main() {
  test('TransactionModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'amount': {'minorUnits': 0, 'currency': 'SAR'},
        'date': '2024-01-01T00:00:00.000Z',
        'paymentMethod': 'cash',
        'merchant': null,
        'category': null,
        'note': null,
    };
    final m = TransactionModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('Transaction equality by identity', () {
    final a = Transaction(id: 'x', amount: Money(minorUnits: 0, currency: 'SAR'), date: DateTime(2024), paymentMethod: PaymentMethod.values.first);
    expect(a, equals(a));
  });
}
