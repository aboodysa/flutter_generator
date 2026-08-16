// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_ledgerly/features/auth/domain/repositories/user_repository.dart';
import 'package:rasheed_replica_ledgerly/features/auth/domain/entities/user.dart';
import 'package:rasheed_replica_ledgerly/features/auth/domain/entities/user_role.dart';

class UserRepositoryInMemoryImpl implements UserRepository {
  final List<User> _items = [User(id: 'x', name: 'Sample User', email: 'x', role: UserRole.values.first), User(id: 'user-1', name: 'Sample User 1', email: 'Sample item 1', role: UserRole.values.first), User(id: 'user-2', name: 'Sample User 2', email: 'Sample item 2', role: UserRole.values.first)];

  @override
  Future<List<User>> listUsers() async => List.unmodifiable(_items);

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
