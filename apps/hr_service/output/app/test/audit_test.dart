// [generated] generator=AuditTestGenerator template=audit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'dart:convert';
import 'package:rasheed_replica_hr_service/generated.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/data/repositories/leave_request_repository_in_memory_impl.dart';

void main() {
  test('recordMutation stamps who/what/before/after/reason/at', () {
    final event = recordMutation(
      entity: 'Widget',
      entityId: 'w-1',
      action: 'update',
      actor: 'user-1',
      before: {'status': 'draft'},
      after: {'status': 'submitted'},
      reason: 'submitted for review',
    );
    expect(event.entity, 'Widget');
    expect(event.entityId, 'w-1');
    expect(event.action, 'update');
    expect(event.actor, 'user-1');
    expect(event.before, {'status': 'draft'});
    expect(event.after, {'status': 'submitted'});
    expect(event.reason, 'submitted for review');
    expect(event.timestamp, isA<DateTime>());
    expect(event.id, isNotEmpty);
  });

  test('AuditLog is append-only: events() is an unmodifiable snapshot', () {
    final log = AuditLog.instance;
    final before = log.events.length;
    log.append(recordMutation(entity: 'Widget', entityId: 'w-2', action: 'create', actor: 'user-1', after: {'status': 'draft'}));
    expect(log.events.length, before + 1, reason: 'append must be reflected');
    expect(
      () => log.events.add(recordMutation(entity: 'Widget', entityId: 'w-3', action: 'create', actor: 'user-1')),
      throwsUnsupportedError,
      reason: 'events() must return an unmodifiable list — there is no way to un-append an event',
    );
  });

  test('toCsv quotes/escapes commas, quotes, and embedded newlines (RFC 4180)', () {
    final rows = [
      {'name': 'Simple', 'note': 'plain'},
      {'name': 'Has, comma', 'note': 'plain'},
      {'name': 'Has "quotes"', 'note': 'plain'},
      {'name': 'Has\nnewline', 'note': 'plain'},
    ];
    final csv = toCsv(rows, const ['name', 'note']);
    final lines = csv.split('\n');
    expect(lines[0], 'name,note');
    expect(lines[2], '"Has, comma",plain');
    expect(lines[3], '"Has ""quotes""",plain');
    expect(csv.contains('"Has\nnewline",plain'), isTrue);
  });

  test('toCsv only ever includes the caller-declared headers — a key left out of headers never leaks', () {
    // Mirrors how screen.ts's export button builds headers from exportableFields(), which already
    // excludes secret-typed fields — this proves the MECHANISM generically: toCsv has no way to
    // surface a row key that isn't in the caller-declared header list.
    final rows = [
      {'name': 'Alice', 'ssn': '123-45-6789'},
    ];
    final csv = toCsv(rows, const ['name']);
    expect(csv.contains('123-45-6789'), isFalse);
    expect(csv.contains('Alice'), isTrue);
  });

  test('toJson renders the same rows as a JSON array', () {
    final rows = [
      {'name': 'Alice', 'age': 30},
    ];
    final json = toJson(rows);
    expect(jsonDecode(json), [
      {'name': 'Alice', 'age': 30},
    ]);
  });

  test('a repo update on an already-exported LeaveRequest row throws (immutability)', () async {
    final repo = LeaveRequestRepositoryInMemoryImpl();
    final items = await repo.listLeaveRequests();
    final original = items.first;
    final exported = LeaveRequest(id: original.id, name: original.name, leaveType: original.leaveType, startDate: original.startDate, endDate: original.endDate, days: original.days, status: original.status, reason: original.reason, exported: true);
    await repo.updateLeaveRequest(exported); // not-yet-exported -> exported: allowed
    expect(repo.updateLeaveRequest(exported), throwsA(isA<StateError>()), reason: 'already-exported rows are immutable — corrections require void + clone');
  });
}
