// [generated] generator=PolicyCoreGenerator template=policy_core.v1 class=structural ownership=generated
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
