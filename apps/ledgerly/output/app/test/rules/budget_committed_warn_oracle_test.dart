// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + BudgetCommittedWarn.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = MealBudget(id: 'mb-1', name: 'Client dinners', limit: Money(minorUnits: 100000, currency: 'SAR'), committed: Money(minorUnits: 30000, currency: 'SAR'), actual: Money(minorUnits: 10000, currency: 'SAR'));
    expect(BudgetCommittedWarn().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = MealBudget(id: 'mb-2', name: 'Team lunches', limit: Money(minorUnits: 100000, currency: 'SAR'), committed: Money(minorUnits: 50000, currency: 'SAR'), actual: Money(minorUnits: 20000, currency: 'SAR'));
    expect(BudgetCommittedWarn().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = MealBudget(id: 'mb-3', name: 'Travel meals', limit: Money(minorUnits: 100000, currency: 'SAR'), committed: Money(minorUnits: 29999, currency: 'SAR'), actual: Money(minorUnits: 5000, currency: 'SAR'));
    expect(BudgetCommittedWarn().evaluate(e), equals(false));
  });
}
