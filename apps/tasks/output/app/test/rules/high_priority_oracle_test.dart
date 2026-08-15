// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + HighPriority.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_tasks/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = Task(id: 't-1', title: 'Fix login bug', dueDate: DateTime(2024), priority: Priority.high, status: TaskStatus.open);
    expect(HighPriority().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = Task(id: 't-2', title: 'Write docs', dueDate: DateTime(2024), priority: Priority.high, status: TaskStatus.closed);
    expect(HighPriority().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = Task(id: 't-3', title: 'Water plants', dueDate: DateTime(2024), priority: Priority.medium, status: TaskStatus.open);
    expect(HighPriority().evaluate(e), equals(false));
  });

  test('case 4: expected false', () {
    final e = Task(id: 't-4', title: 'Plan retro', dueDate: DateTime(2024), priority: Priority.low, status: TaskStatus.open);
    expect(HighPriority().evaluate(e), equals(false));
  });
}
