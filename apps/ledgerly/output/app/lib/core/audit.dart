// [generated] generator=AuditCoreGenerator template=audit_core.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

// L3: append-only audit trail — who did what to which record, before/after snapshots, why.
// AuditEvent is immutable; AuditLog never exposes a way to remove or edit a recorded event, only
// append one (`append`) — "append-only" is enforced by the class's own API surface, not just by
// convention (no generated caller has any method to reach for that would let it "un-happen").
class AuditEvent {
  const AuditEvent({
    required this.id,
    required this.entity,
    required this.entityId,
    required this.action,
    required this.actor,
    this.before,
    this.after,
    this.reason,
    required this.timestamp,
    required this.device,
  });

  final String id;
  final String entity;
  final String entityId;
  final String action; // 'create' | 'update' | 'delete'
  final String actor;
  final Map<String, dynamic>? before;
  final Map<String, dynamic>? after;
  final String? reason;
  final DateTime timestamp;
  final String device;
}

/// The one domain rule L3 exists to enforce: every mutation gets a fully-stamped event. Pure —
/// takes everything it needs as arguments, touches no global state, so it's independently
/// unit-testable without a live AuditLog instance. `id` is a deterministic hash of the call's own
/// inputs (entity+entityId+action+timestamp), not a random/uuid dependency — same "deterministic,
/// dependency-free" posture core/money.dart documents for itself.
AuditEvent recordMutation({
  required String entity,
  required String entityId,
  required String action,
  required String actor,
  Map<String, dynamic>? before,
  Map<String, dynamic>? after,
  String? reason,
}) {
  final at = DateTime.now();
  final id = '$entity:$entityId:$action:${at.microsecondsSinceEpoch}'.hashCode.toRadixString(16);
  return AuditEvent(
    id: id,
    entity: entity,
    entityId: entityId,
    action: action,
    actor: actor,
    before: before,
    after: after,
    reason: reason,
    timestamp: at,
    // Placeholder until a real device/platform source is wired — deliberately not `dart:io`'s
    // Platform (would break the web target this generator's CFT/CDP harness runs against), same
    // "mock is the runtime until a real provider exists" posture MF3's MockReceiptOcr documents.
    device: 'app',
  );
}

/// App-wide, in-memory, append-only store — the single source of truth the generated
/// AuditLogScreen reads and every audited repository impl writes to. One instance per app run
/// (no persistence): offline-first, same posture core/session.dart's Session singleton takes.
class AuditLog {
  AuditLog._();
  static final AuditLog instance = AuditLog._();

  final List<AuditEvent> _events = [];

  void append(AuditEvent event) => _events.add(event);

  List<AuditEvent> get events => List.unmodifiable(_events);
}
