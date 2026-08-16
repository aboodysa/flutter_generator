// [generated] generator=RuleOracleTestGenerator template=oracle_test.v1 class=semantic ownership=generated
// Do not hand-edit this file; regenerate from IR + NeedsManagerReview.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_work_auth/generated.dart';

void main() {
  test('case 1: expected true', () {
    final e = WorkAuth(id: 'w-1', name: 'Ada', country: 'SA', jobTitle: 'Engineer', startDate: DateTime(2024), durationDays: 90, status: WorkAuthStatus.draft);
    expect(NeedsManagerReview().evaluate(e), equals(true));
  });

  test('case 2: expected true', () {
    final e = WorkAuth(id: 'w-2', name: 'Bea', country: 'AE', jobTitle: 'Analyst', startDate: DateTime(2024), durationDays: 61, status: WorkAuthStatus.submitted);
    expect(NeedsManagerReview().evaluate(e), equals(true));
  });

  test('case 3: expected false', () {
    final e = WorkAuth(id: 'w-3', name: 'Cy', country: 'SA', jobTitle: 'Designer', startDate: DateTime(2024), durationDays: 60, status: WorkAuthStatus.draft);
    expect(NeedsManagerReview().evaluate(e), equals(false));
  });

  test('case 4: expected false', () {
    final e = WorkAuth(id: 'w-4', name: 'Deb', country: 'SA', jobTitle: 'Manager', startDate: DateTime(2024), durationDays: 30, status: WorkAuthStatus.approved);
    expect(NeedsManagerReview().evaluate(e), equals(false));
  });
}
