// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/core/no_params.dart';
import 'package:rasheed_replica_ledgerly/features/auth/domain/entities/user.dart';
import 'package:rasheed_replica_ledgerly/features/auth/domain/repositories/user_repository.dart';

class ListUsers {
  final UserRepository repository;
  const ListUsers(this.repository);

  Future<List<User>> call(NoParams params) => repository.listUsers();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
