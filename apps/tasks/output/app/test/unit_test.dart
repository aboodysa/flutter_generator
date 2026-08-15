// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_tasks/generated.dart';

void main() {
  test('TaskModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'title': 'x',
        'dueDate': '2024-01-01T00:00:00.000Z',
        'priority': 'low',
        'status': 'open',
    };
    final m = TaskModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('Task equality by identity', () {
    final a = Task(id: 'x', title: 'x', dueDate: DateTime(2024), priority: Priority.values.first, status: TaskStatus.values.first);
    expect(a, equals(a));
  });
}
