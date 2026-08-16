// [generated] generator=BudgetCoreGenerator template=budget_core.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'money.dart';

// MF5: budget/quota — live remaining computed as limit − committed (submitted) − actual
// (approved). Pure, app-type-agnostic; no entity-specific field beyond the generic BudgetLine
// shape below.
class BudgetLine {
  const BudgetLine({
    required this.scope,
    required this.limit,
    required this.committed,
    required this.actual,
  });

  final String scope;
  final Money limit;
  final Money committed;
  final Money actual;

  /// What remains after committed (submitted/pending) and actual (approved/paid) are subtracted
  /// from the limit, PLUS a hypothetical extra commitment (e.g. a new claim being entered before
  /// submit) — pass a zero Money of the limit's currency to project the current state unchanged
  /// (see [remaining]). Deliberately not clamped at zero: an over-limit budget reports a negative
  /// remaining so the UI/policy layer can show and act on it, never silently floors to zero.
  Money remainingAfter(Money extraCommitted) => limit - committed - actual - extraCommitted;

  Money get remaining => remainingAfter(Money(minorUnits: 0, currency: limit.currency));

  /// Fraction of the limit already used (committed + actual). Deliberately NOT clamped to 1.0 so
  /// an over-limit budget still reports its true percentage (e.g. 1.35 == 135% used) instead of
  /// hiding the overage behind a capped number. A zero limit reports 0 rather than dividing by
  /// zero — an unconfigured/zero-ceiling budget is "unused", not "infinitely used".
  double get pctUsed {
    if (limit.minorUnits == 0) return 0;
    return (committed.minorUnits + actual.minorUnits) / limit.minorUnits;
  }

  bool get isOverLimit => (committed.minorUnits + actual.minorUnits) > limit.minorUnits;
}
