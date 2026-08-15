// [generated] generator=RepositoryImplGenerator template=repository_impl.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR. In-memory demo data source — create/update/
// delete mutate the private list so subsequent list/get calls see the change. Swap for a real
// datasource by editing the generated methods.
import 'package:rasheed_replica_tasks/features/tasks/domain/repositories/task_repository.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/priority.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/task_status.dart';

class TaskRepositoryInMemoryImpl implements TaskRepository {
  final List<Task> _items = [Task(id: 'x', title: 'Sample Task', dueDate: DateTime(2024), priority: Priority.values.first, status: TaskStatus.values.first), Task(id: 'task-1', title: 'Sample Task 1', description: 'Sample item 1', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first), Task(id: 'task-2', title: 'Sample Task 2', description: 'Sample item 2', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first)];

  @override
  Future<List<Task>> listTasks() async => List.unmodifiable(_items);

  @override
  Future<Task> getTask(String id) async =>
      _items.firstWhere((e) => e.id == id, orElse: () => _items.first);

  @override
  Future<Task> createTask(Task task) async {
    _items.add(task);
    return task;
  }

  @override
  Future<void> updateTask(Task task) async {
    final idx = _items.indexWhere((e) => e.id == task.id);
    if (idx != -1) _items[idx] = task;
  }

  @override
  Future<void> deleteTask(String id) async {
    _items.removeWhere((e) => e.id == id);
  }

  // Remaining operations (not CRUD-classified — custom/business ops) via noSuchMethod until wired:
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}
