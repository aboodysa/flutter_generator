// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/repositories/pick_repository.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/answer_option.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/mood_option.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/domain/entities/pick.dart';

class PickRepositoryInMemoryImpl implements PickRepository {
  final List<Pick> _items = [Pick(id: 'x', label: 'Sample Pick', answer: AnswerOption.values.first, mood: MoodOption.values.first), Pick(id: 'pick-1', label: 'Sample Pick 1', answer: AnswerOption.values.first, mood: MoodOption.values.first), Pick(id: 'pick-2', label: 'Sample Pick 2', answer: AnswerOption.values.first, mood: MoodOption.values.first)];

  @override
  Future<List<Pick>> listPicks() async => List.unmodifiable(_items);

  @override
  Future<Pick> createPick(Pick pick) async {
    _items.add(pick);
    return pick;
  }

  @override
  Future<void> updatePick(Pick pick) async {
    final idx = _items.indexWhere((e) => e.id == pick.id);
    if (idx != -1) _items[idx] = pick;
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
