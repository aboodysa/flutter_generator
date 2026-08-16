// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + MicroExpenseAutoApprove.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = ExpenseClaim(id: 'ec-1', name: 'Taxi', amount: Money(minorUnits: 5000, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(MicroExpenseAutoApprove().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = ExpenseClaim(id: 'ec-2', name: 'Coffee', amount: Money(minorUnits: 2500, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(MicroExpenseAutoApprove().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = ExpenseClaim(id: 'ec-3', name: 'Lunch', amount: Money(minorUnits: 5100, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(MicroExpenseAutoApprove().evaluate(e), equals(false));
  });

  test('case 4: expected false', () {
    final e = ExpenseClaim(id: 'ec-4', name: 'Hotel', amount: Money(minorUnits: 50000, currency: 'SAR'), status: ClaimStatus.pending, exported: false);
    expect(MicroExpenseAutoApprove().evaluate(e), equals(false));
  });
}
