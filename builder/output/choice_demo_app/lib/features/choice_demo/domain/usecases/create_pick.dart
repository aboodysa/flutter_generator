// [generated] generator=UseCaseGenerator template=use_case.v1 class=structural ownership=scaffold
// Do not hand-edit this file; regenerate from IR.
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/repositories/pick_repository.dart';

class CreatePick {
  final PickRepository repository;
  const CreatePick(this.repository);

  Future<Pick> call(Pick params) => repository.createPick(params);

// [user] region:user — hand-written extension (preserved on regen)
// [end] region:user
}
