// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + ExecutiveExpenseBlock.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = ExpenseClaim(id: 'ec-12', name: 'Offsite', amount: Money(minorUnits: 1500000, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(ExecutiveExpenseBlock().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = ExpenseClaim(id: 'ec-13', name: 'Retreat', amount: Money(minorUnits: 2000000, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(ExecutiveExpenseBlock().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = ExpenseClaim(id: 'ec-14', name: 'Team event', amount: Money(minorUnits: 1499900, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(ExecutiveExpenseBlock().evaluate(e), equals(false));
  });
}
