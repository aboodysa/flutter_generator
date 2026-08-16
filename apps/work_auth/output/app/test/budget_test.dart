// [generated] generator=BudgetTestGenerator template=budget_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_work_auth/generated.dart';

void main() {
  const limit = Money(minorUnits: 100000, currency: 'SAR'); // 1,000.00

  test('remaining subtracts committed and actual from the limit', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 20000, currency: 'SAR'), // 200.00 submitted
      actual: const Money(minorUnits: 38000, currency: 'SAR'), // 380.00 approved
    );
    expect(line.remaining.minorUnits, 42000, reason: '1000.00 - 200.00 - 380.00 = 420.00');
  });

  test('pctUsed reports the fraction of the limit already committed+actual', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 20000, currency: 'SAR'),
      actual: const Money(minorUnits: 42000, currency: 'SAR'),
    );
    // (200 + 420) / 1000 = 0.62 — the exact fraction the generated "used X%" UI rounds from.
    expect(line.pctUsed, closeTo(0.62, 0.0001));
    expect((line.pctUsed * 100).round(), 62, reason: "must match the generated UI's used-X% rounding exactly");
  });

  test('a budget exactly at its limit is not over', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 0, currency: 'SAR'),
      actual: limit,
    );
    expect(line.isOverLimit, isFalse);
    expect(line.remaining.minorUnits, 0);
  });

  test('one minor unit over the limit is over-limit and reports a negative remaining', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 0, currency: 'SAR'),
      actual: const Money(minorUnits: 100001, currency: 'SAR'),
    );
    expect(line.isOverLimit, isTrue);
    expect(line.remaining.minorUnits, -1, reason: 'over-limit is a visible negative, never clamped to zero');
    expect(line.pctUsed, greaterThan(1.0), reason: 'pctUsed is not capped at 100% either');
  });

  test('a zero-limit budget reports 0% used, not a divide-by-zero', () {
    final line = BudgetLine(
      scope: 'Unset',
      limit: const Money(minorUnits: 0, currency: 'SAR'),
      committed: const Money(minorUnits: 0, currency: 'SAR'),
      actual: const Money(minorUnits: 0, currency: 'SAR'),
    );
    expect(line.pctUsed, 0);
    expect(line.isOverLimit, isFalse);
  });

  test('remainingAfter projects a hypothetical extra commitment without mutating the line', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 20000, currency: 'SAR'),
      actual: const Money(minorUnits: 38000, currency: 'SAR'),
    );
    final projected = line.remainingAfter(const Money(minorUnits: 10000, currency: 'SAR')); // +100.00 pending
    expect(projected.minorUnits, 32000, reason: '420.00 remaining - 100.00 new pending = 320.00');
    expect(line.remaining.minorUnits, 42000, reason: 'remainingAfter must not mutate the original line');
  });
}
