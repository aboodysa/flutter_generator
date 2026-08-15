// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_tasks/features/tasks/domain/repositories/follow_up_repository.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/follow_up.dart';

class FollowUpRepositoryInMemoryImpl implements FollowUpRepository {
  final List<FollowUp> _items = [FollowUp(id: 'x', taskId: 'x', note: 'x', createdAt: DateTime(2024)), FollowUp(id: 'Sample item 1', taskId: 'Sample item 1', note: 'Sample item 1', createdAt: DateTime(2025)), FollowUp(id: 'Sample item 2', taskId: 'Sample item 2', note: 'Sample item 2', createdAt: DateTime(2025))];

  @override
  Future<List<FollowUp>> listFollowUps() async => List.unmodifiable(_items);

  @override
  Future<FollowUp> getFollowUp(String id) async =>
      _items.firstWhere((e) => e.id == id, orElse: () => _items.first);

  @override
  Future<FollowUp> createFollowUp(FollowUp followUp) async {
    _items.add(followUp);
    return followUp;
  }

  @override
  Future<void> updateFollowUp(FollowUp followUp) async {
    final idx = _items.indexWhere((e) => e.id == followUp.id);
    if (idx != -1) _items[idx] = followUp;
  }

  @override
  Future<void> deleteFollowUp(String id) async {
    _items.removeWhere((e) => e.id == id);
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
