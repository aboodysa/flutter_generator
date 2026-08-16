/**
 * BudgetCoreGenerator — structural, deterministic, 0% LLM (MF5).
 * Emits `core/budget.dart` once per app that declares `attributes.budget` and it resolves against
 * a real entity + three Money fields (operations.ts's resolveBudget). Mirrors L2/MF4's precedent:
 * a single shared, app-type-agnostic module — BudgetLine depends only on the generic Money shape,
 * never on any entity-specific field name, so the same file works unchanged for Ledgerly's meal
 * budget, an HR headcount budget, or work_auth's visa quota (Money's minorUnits+tag pair is reused
 * for a bounded COUNT there, not currency — see the task report for the "never double" rationale).
 *
 * This is the first core/*.dart file that imports another core/*.dart file (money.dart) — safe
 * because emission is gated on resolveBudget succeeding, which requires the three pointed-at
 * fields to already be Money-typed, so hasMoneyFields(ir) (and therefore core/money.dart) is
 * always true whenever core/budget.dart is emitted.
 */
export function generateBudgetCore(): string {
  return `// [generated] generator=BudgetCoreGenerator template=budget_core.v1 class=structural ownership=generated
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
`;
}
