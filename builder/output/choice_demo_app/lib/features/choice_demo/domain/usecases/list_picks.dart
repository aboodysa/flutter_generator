// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_choice_demo/core/no_params.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/repositories/pick_repository.dart';

class ListPicks {
  final PickRepository repository;
  const ListPicks(this.repository);

  Future<List<Pick>> call(NoParams params) => repository.listPicks();

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
