// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_ledgerly/features/auth/domain/entities/user.dart';

abstract interface class UserRepository {
  Future<List<User>> listUsers();
}
