// [generated] generator=RepositoryContractGenerator template=repository_contract.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';

abstract interface class PickRepository {
  Future<List<Pick>> listPicks();
  Future<Pick> createPick(Pick pick);
  Future<void> updatePick(Pick pick);
}
