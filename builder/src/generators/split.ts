/**
 * SplitCoreGenerator — structural, deterministic, 0% LLM (MF4).
 * Emits `core/split.dart` once per app that declares >=1 split group (operations.ts's
 * hasSplitGroups). Mirrors L2's policy.ts precedent: a single pure, app-type-agnostic module
 * shared by every split-capable entity's form/detail screen, rather than per-entity generation —
 * "sum to 100%" doesn't depend on any entity-specific field beyond the generic SplitLine.percent,
 * so (unlike L2's per-entity evaluate<Entity>Policy) there is nothing entity-specific to emit.
 */
export function generateSplitCore(): string {
  return `// [generated] generator=SplitCoreGenerator template=split_core.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/widgets.dart';

// MF4: split/allocation — a parent entity's amount divided across categories, expressed as
// percentages that must sum to exactly 100%. Pure, app-type-agnostic (expense category split,
// commission split, cost-center allocation all reuse this unchanged). Percent-only in this
// iteration — amount-mode splits (summing to the parent's Money total) are a documented, deferred
// scope (see the task report), not silently approximated.
const double kSplitTolerance = 0.01;

class SplitLine {
  const SplitLine({required this.category, required this.percent});

  final String category;
  final double percent;
}

/// The one domain rule MF4 exists to enforce. Splitting is opt-in per record — a record with NO
/// split lines configured (the common case) is valid; the sum-to-100% rule only kicks in once
/// the user has added at least one line. Without this, every record that never touches the Split
/// section at all would be permanently blocked from saving (0% never equals 100%).
List<String> validateSplit(List<SplitLine> lines) {
  if (lines.isEmpty) return const [];
  final total = lines.fold<double>(0, (sum, l) => sum + l.percent);
  if ((total - 100).abs() > kSplitTolerance) {
    return ['Split must sum to exactly 100% (currently \${total.toStringAsFixed(2)}%).'];
  }
  return const [];
}

// One editable split row's controllers — shared across every split-capable entity's form so the
// controller lifecycle (create/dispose) is defined once, not duplicated per generated form.
class SplitRowControllers {
  SplitRowControllers({String category = '', String percent = ''})
      : category = TextEditingController(text: category),
        percent = TextEditingController(text: percent);

  final TextEditingController category;
  final TextEditingController percent;

  void dispose() {
    category.dispose();
    percent.dispose();
  }
}
`;
}
