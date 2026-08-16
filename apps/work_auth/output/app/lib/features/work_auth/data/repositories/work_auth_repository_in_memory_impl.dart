// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_work_auth/features/work_auth/domain/repositories/work_auth_repository.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/domain/entities/work_auth_status.dart';

class WorkAuthRepositoryInMemoryImpl implements WorkAuthRepository {
  final List<WorkAuth> _items = [WorkAuth(id: 'x', name: 'Sample WorkAuth', country: 'x', jobTitle: 'x', startDate: DateTime(2024), durationDays: 0, status: WorkAuthStatus.values.first), WorkAuth(id: 'work-auth-1', name: 'Sample WorkAuth 1', country: 'Sample item 1', jobTitle: 'Sample item 1', startDate: DateTime(2025), durationDays: 1, status: WorkAuthStatus.values.first), WorkAuth(id: 'work-auth-2', name: 'Sample WorkAuth 2', country: 'Sample item 2', jobTitle: 'Sample item 2', startDate: DateTime(2025), durationDays: 2, status: WorkAuthStatus.values.first)];

  @override
  Future<List<WorkAuth>> listWorkAuths() async => List.unmodifiable(_items);

  @override
  Future<WorkAuth> createWorkAuth(WorkAuth workAuth) async {
    _items.add(workAuth);
    return workAuth;
  }

  @override
  Future<void> updateWorkAuth(WorkAuth workAuth) async {
    final idx = _items.indexWhere((e) => e.id == workAuth.id);
    if (idx != -1) _items[idx] = workAuth;
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
