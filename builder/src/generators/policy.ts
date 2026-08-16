import { EntityModel, RuleModel } from "../types";
import { GenContext } from "../dart";

/**
 * PolicyCoreGenerator / PolicyEngineGenerator — structural/semantic, deterministic, 0% LLM (L2).
 * A rule evaluation graduates from a bare bool/String outcome to a PolicyVerdict — severity +
 * plain-language message the UI can show BEFORE submit, plus an append-only waiver stamp. This
 * is app-type agnostic: Ledgerly (expense policy), HR (leave policy), CRM (discount policy) all
 * reuse the same evaluate<Entity>Policy() shape, one generated file per entity that has policy
 * rules (see operations.ts's isPolicyRule/policyEntities — the single source of truth for which
 * rules/entities are in scope).
 */

// core/policy.dart — emitted once per app (see index.ts's hasPolicyRules gate, mirroring how
// core/money.dart is only emitted when the IR actually has money fields).
export function generatePolicyCore(): string {
  return `// [generated] generator=PolicyCoreGenerator template=policy_core.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

/// L2: the severity a fired rule is scored at — decides how the generated UI reacts.
/// autoApprove: informational only, never shown as a blocking panel.
/// warn: shown to the user, never blocks Save/Finish.
/// requireJustification: blocks Save/Finish until a justification is typed (or the verdict is waived).
/// block: always blocks Save/Finish until the verdict is waived.
enum PolicySeverity { autoApprove, warn, requireJustification, block }

/// One rule's evaluation outcome against one entity instance. Immutable and append-only: waiving
/// a verdict never mutates it in place — waive() returns a NEW PolicyVerdict with the waiver
/// stamp added, so the pre-waive verdict is always still reconstructable (audit-friendly; L3 owns
/// the full AuditEvent trail, this is the minimal per-verdict stamp L2 asks for).
class PolicyVerdict {
  const PolicyVerdict({
    required this.ruleId,
    required this.severity,
    required this.message,
    this.waivedBy,
    this.waivedReason,
    this.waivedAt,
  });

  final String ruleId;
  final PolicySeverity severity;
  final String message;
  final String? waivedBy;
  final String? waivedReason;
  final DateTime? waivedAt;

  bool get isWaived => waivedBy != null;
  bool get blocksAdvance => severity == PolicySeverity.block && !isWaived;
  bool get requiresJustification => severity == PolicySeverity.requireJustification && !isWaived;

  /// Finance/reviewer override — waivedReason is mandatory (never a silent override).
  PolicyVerdict waive({required String waivedBy, required String waivedReason}) {
    if (waivedReason.trim().isEmpty) {
      throw ArgumentError('waivedReason is mandatory');
    }
    return PolicyVerdict(
      ruleId: ruleId,
      severity: severity,
      message: message,
      waivedBy: waivedBy,
      waivedReason: waivedReason,
      waivedAt: DateTime.now(),
    );
  }
}
`;
}

// domain/policy/<entity>_policy.dart — one per entity that has >=1 policy rule. Runs ALL of that
// entity's policy rules (not first-match, per L2's spec) so e.g. a warn and a block on the same
// entity both surface at once instead of only the first one found.
export function generateEntityPolicy(entity: EntityModel, rules: RuleModel[], ctx?: GenContext): string {
  const entityImport = ctx?.symbols.get(entity.name)
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get(entity.name)}';`
    : `import '${entity.name.toLowerCase()}.dart';`;
  const policyImport = ctx?.symbols.get("PolicyVerdict")
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get("PolicyVerdict")}';`
    : `import '../../core/policy.dart';`;
  const ruleImports = rules
    .map((r) => (ctx?.symbols.get(r.name)
      ? `import 'package:${ctx.pkg}/${ctx.symbols.get(r.name)}';`
      : `import '../rules/${r.name.toLowerCase()}.dart';`))
    .join("\n");

  const checks = rules
    .map((r) => `  if (${r.name}().evaluate(e)) {
    verdicts.add(const PolicyVerdict(
      ruleId: '${r.name}',
      severity: PolicySeverity.${r.severity},
      message: '${(r.message ?? "").replace(/'/g, "\\'")}',
    ));
  }`)
    .join("\n");

  return `// [generated] generator=PolicyEngineGenerator template=policy_engine.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR.
${entityImport}
${policyImport}
${ruleImports}

/// L2: every severity'd rule declared for ${entity.name}, evaluated in full (never first-match).
List<PolicyVerdict> evaluate${entity.name}Policy(${entity.name} e) {
  final verdicts = <PolicyVerdict>[];
${checks}
  return verdicts;
}
`;
}
