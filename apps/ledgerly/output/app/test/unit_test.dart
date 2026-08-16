// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';

void main() {
  test('UserModel fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
        'id': 'x',
        'name': 'x',
        'email': 'x',
        'role': 'employee',
    };
    final m = UserModel.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('User equality by identity', () {
    final a = User(id: 'x', name: 'x', email: 'x', role: UserRole.values.first);
    expect(a, equals(a));
  });
}
