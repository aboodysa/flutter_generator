// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/follow_up.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/repositories/follow_up_repository.dart';
import 'package:rasheed_replica_tasks/core/no_params.dart';

class ListFollowUps {
  final FollowUpRepository repository;
  const ListFollowUps(this.repository);

  Future<List<FollowUp>> call(NoParams params) => repository.listFollowUps();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
