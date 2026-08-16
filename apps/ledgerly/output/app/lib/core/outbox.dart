// [generated] generator=OutboxCoreGenerator template=outbox_core.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.

// MF6: offline outbox — every write-ahead-enqueued mutation waiting to sync to a real backend
// (P9) once one exists. Deterministic, in-memory, no network — the point of this slice is the
// queue's own correctness (enqueue/replay order/retry bookkeeping), not a real sync loop.
enum OutboxStatus { pending, syncing, sent, failed }

class OutboxMessage {
  const OutboxMessage({
    required this.id,
    required this.entity,
    required this.entityId,
    required this.action,
    this.payload,
    required this.createdAt,
    this.status = OutboxStatus.pending,
    this.attempts = 0,
    this.lastError,
  });

  final String id;
  final String entity;
  final String entityId;
  final String action; // 'create' | 'update' | 'delete'
  final Map<String, dynamic>? payload;
  final DateTime createdAt;
  final OutboxStatus status;
  final int attempts;
  final String? lastError;

  OutboxMessage copyWith({OutboxStatus? status, int? attempts, String? lastError}) => OutboxMessage(
        id: id,
        entity: entity,
        entityId: entityId,
        action: action,
        payload: payload,
        createdAt: createdAt,
        status: status ?? this.status,
        attempts: attempts ?? this.attempts,
        lastError: lastError ?? this.lastError,
      );
}

/// App-wide, in-memory, singleton queue — the single source of truth every outbox-enabled
/// repository impl writes to (write-ahead: enqueued BEFORE the in-memory list is mutated) and
/// whatever eventually drains it (P9-era) reads from. One instance per app run (no persistence):
/// offline-first, same posture core/session.dart's Session singleton takes.
class Outbox {
  Outbox._();
  static final Outbox instance = Outbox._();

  final List<OutboxMessage> _messages = [];

  /// `id` is a deterministic hash of the call's own inputs (entity+entityId+action+timestamp),
  /// not a random/uuid dependency — same "deterministic, dependency-free" posture core/money.dart
  /// documents for itself (and core/audit.dart's recordMutation already established).
  OutboxMessage enqueue({
    required String entity,
    required String entityId,
    required String action,
    Map<String, dynamic>? payload,
  }) {
    final at = DateTime.now();
    final id = '$entity:$entityId:$action:${at.microsecondsSinceEpoch}'.hashCode.toRadixString(16);
    final message = OutboxMessage(id: id, entity: entity, entityId: entityId, action: action, payload: payload, createdAt: at);
    _messages.add(message);
    return message;
  }

  void markSyncing(String id) => _update(id, (m) => m.copyWith(status: OutboxStatus.syncing));

  /// A sent message is NOT physically removed (the append-only history stays reconstructable,
  /// same reasoning core/audit.dart's AuditLog never deletes) — it just stops being pending(),
  /// which is the observable "removed" the sync loop actually cares about.
  void markSent(String id) => _update(id, (m) => m.copyWith(status: OutboxStatus.sent));

  void markFailed(String id, String error) =>
      _update(id, (m) => m.copyWith(status: OutboxStatus.failed, attempts: m.attempts + 1, lastError: error));

  /// Backoff is the caller's decision (how long to wait given `attempts`) — retry() only performs
  /// the state transition (failed -> pending) once the caller decides it's time to try again.
  void retry(String id) => _update(id, (m) => m.copyWith(status: OutboxStatus.pending));

  void _update(String id, OutboxMessage Function(OutboxMessage) fn) {
    final idx = _messages.indexWhere((m) => m.id == id);
    if (idx != -1) _messages[idx] = fn(_messages[idx]);
  }

  /// FIFO — insertion order, so replay is deterministic (same message set always drains in the
  /// same order).
  List<OutboxMessage> pending() => List.unmodifiable(_messages.where((m) => m.status == OutboxStatus.pending));

  List<OutboxMessage> get all => List.unmodifiable(_messages);
}
