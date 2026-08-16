// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + LargeExpenseJustify.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = ExpenseClaim(id: 'ec-9', name: 'Equipment', amount: Money(minorUnits: 200000, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(LargeExpenseJustify().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = ExpenseClaim(id: 'ec-10', name: 'Training', amount: Money(minorUnits: 300000, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(LargeExpenseJustify().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = ExpenseClaim(id: 'ec-11', name: 'Travel', amount: Money(minorUnits: 199999, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(LargeExpenseJustify().evaluate(e), equals(false));
  });
}
