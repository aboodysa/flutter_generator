// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_work_auth/generated.dart';

void main() {
  test('WorkAuthModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'name': 'x',
        'country': 'x',
        'jobTitle': 'x',
        'startDate': '2024-01-01T00:00:00.000Z',
        'durationDays': 0,
        'status': 'draft',
    };
    final m = WorkAuthModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('WorkAuth equality by identity', () {
    final a = WorkAuth(id: 'x', name: 'x', country: 'x', jobTitle: 'x', startDate: DateTime(2024), durationDays: 0, status: WorkAuthStatus.values.first);
    expect(a, equals(a));
  });
}
