// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/follow_up.dart';

abstract interface class FollowUpRepository {
  Future<List<FollowUp>> listFollowUps();
  Future<FollowUp> getFollowUp(String id);
  Future<FollowUp> createFollowUp(FollowUp followUp);
  Future<void> updateFollowUp(FollowUp followUp);
  Future<void> deleteFollowUp(String id);
}
