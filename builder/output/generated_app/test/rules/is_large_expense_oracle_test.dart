// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + isLargeExpense.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_expense_tracker/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = Transaction(id: 'tx-1', amount: Money(minorUnits: 150000, currency: 'SAR'), date: DateTime.parse('2024-01-01T00:00:00.000Z'), paymentMethod: PaymentMethod.cash);
    expect(isLargeExpense().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = Transaction(id: 'tx-2', amount: Money(minorUnits: 100000, currency: 'SAR'), date: DateTime.parse('2024-01-02T00:00:00.000Z'), paymentMethod: PaymentMethod.cash);
    expect(isLargeExpense().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = Transaction(id: 'tx-3', amount: Money(minorUnits: 99999, currency: 'SAR'), date: DateTime.parse('2024-01-03T00:00:00.000Z'), paymentMethod: PaymentMethod.cash);
    expect(isLargeExpense().evaluate(e), equals(false));
  });

  test('case 4: expected false', () {
    final e = Transaction(id: 'tx-4', amount: Money(minorUnits: 0, currency: 'SAR'), date: DateTime.parse('2024-01-04T00:00:00.000Z'), paymentMethod: PaymentMethod.cash);
    expect(isLargeExpense().evaluate(e), equals(false));
  });
}
