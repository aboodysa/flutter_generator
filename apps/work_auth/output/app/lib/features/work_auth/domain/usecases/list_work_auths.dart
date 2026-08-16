// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_work_auth/core/no_params.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/repositories/work_auth_repository.dart';

class ListWorkAuths {
  final WorkAuthRepository repository;
  const ListWorkAuths(this.repository);

  Future<List<WorkAuth>> call(NoParams params) => repository.listWorkAuths();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
