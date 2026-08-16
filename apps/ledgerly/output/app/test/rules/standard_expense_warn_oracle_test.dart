// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + StandardExpenseWarn.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = ExpenseClaim(id: 'ec-5', name: 'Flight', amount: Money(minorUnits: 50000, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(StandardExpenseWarn().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = ExpenseClaim(id: 'ec-6', name: 'Conference', amount: Money(minorUnits: 75000, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(StandardExpenseWarn().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = ExpenseClaim(id: 'ec-7', name: 'Supplies', amount: Money(minorUnits: 49999, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(StandardExpenseWarn().evaluate(e), equals(false));
  });

  test('case 4: expected false', () {
    final e = ExpenseClaim(id: 'ec-8', name: 'Sample', amount: Money(minorUnits: 0, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(StandardExpenseWarn().evaluate(e), equals(false));
  });
}
