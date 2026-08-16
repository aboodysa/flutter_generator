// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth.dart';

abstract interface class WorkAuthRepository {
  Future<List<WorkAuth>> listWorkAuths();
  Future<WorkAuth> createWorkAuth(WorkAuth workAuth);
  Future<void> updateWorkAuth(WorkAuth workAuth);
}
