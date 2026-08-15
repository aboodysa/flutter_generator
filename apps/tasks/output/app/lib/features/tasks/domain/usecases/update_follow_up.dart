// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/follow_up.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/repositories/follow_up_repository.dart';

class UpdateFollowUp {
  final FollowUpRepository repository;
  const UpdateFollowUp(this.repository);

  Future<void> call(FollowUp params) => repository.updateFollowUp(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
