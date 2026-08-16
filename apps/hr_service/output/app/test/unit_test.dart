// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_hr_service/generated.dart';

void main() {
  test('LeaveRequestModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'name': 'x',
        'leaveType': 'annual',
        'startDate': '2024-01-01T00:00:00.000Z',
        'endDate': '2024-01-01T00:00:00.000Z',
        'days': 0,
        'status': 'open',
        'reason': null,
    };
    final m = LeaveRequestModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('LeaveRequest equality by identity', () {
    final a = LeaveRequest(id: 'x', name: 'x', leaveType: LeaveType.values.first, startDate: DateTime(2024), endDate: DateTime(2024), days: 0, status: LeaveStatus.values.first);
    expect(a, equals(a));
  });
}
