// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + LongLeave.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_hr_service/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = LeaveRequest(id: 'l-1', name: 'Ada', leaveType: LeaveType.annual, startDate: DateTime(2024), endDate: DateTime(2024), days: 14, status: LeaveStatus.open, exported: false);
    expect(LongLeave().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = LeaveRequest(id: 'l-2', name: 'Bea', leaveType: LeaveType.sick, startDate: DateTime(2024), endDate: DateTime(2024), days: 11, status: LeaveStatus.open, exported: false);
    expect(LongLeave().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = LeaveRequest(id: 'l-3', name: 'Cy', leaveType: LeaveType.unpaid, startDate: DateTime(2024), endDate: DateTime(2024), days: 10, status: LeaveStatus.open, exported: false);
    expect(LongLeave().evaluate(e), equals(false));
  });

  test('case 4: expected false', () {
    final e = LeaveRequest(id: 'l-4', name: 'Deb', leaveType: LeaveType.annual, startDate: DateTime(2024), endDate: DateTime(2024), days: 2, status: LeaveStatus.approved, exported: false);
    expect(LongLeave().evaluate(e), equals(false));
  });
}
