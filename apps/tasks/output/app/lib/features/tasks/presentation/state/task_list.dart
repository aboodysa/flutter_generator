// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/create_task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/delete_task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/list_tasks.dart';
import 'package:rasheed_replica_tasks/core/no_params.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/entities/task.dart';
import 'package:rasheed_replica_tasks/features/tasks/domain/usecases/update_task.dart';

enum TaskListStatus { initial, loading, success, failure }

class TaskListState extends Equatable {
  final TaskListStatus status;
  final List<Task> tasks;
  final String? errorMessage;

  const TaskListState({
    this.status = TaskListStatus.initial,
    this.tasks = const [],
    this.errorMessage,
  });

  TaskListState copyWith({
    TaskListStatus? status,
    List<Task>? tasks,
    String? errorMessage,
  }) => TaskListState(
    status: status ?? this.status,
    tasks: tasks ?? this.tasks,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, tasks, errorMessage];
}

class TaskListCubit extends Cubit<TaskListState> {
  final ListTasks _listTasks;
  final CreateTask? _createTask;
  final UpdateTask? _updateTask;
  final DeleteTask? _deleteTask;
  TaskListCubit(this._listTasks, [this._createTask, this._updateTask, this._deleteTask]) : super(const TaskListState());

  Future<void> load() async {
    emit(state.copyWith(status: TaskListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      final items = await _listTasks.call(NoParams());
      emit(state.copyWith(status: TaskListStatus.success, tasks: items));
    } catch (e) {
      emit(state.copyWith(status: TaskListStatus.failure, errorMessage: e.toString()));
    }
  }

  Future<void> create(Task item) async {
    if (_createTask != null) await _createTask!.call(item);
    emit(state.copyWith(tasks: [...state.tasks, item]));
  }

  Future<void> update(Task item) async {
    if (_updateTask != null) await _updateTask!.call(item);
    final idx = state.tasks.indexWhere((e) => e.id == item.id);
    if (idx == -1) return;
    final next = List<Task>.of(state.tasks)..[idx] = item;
    emit(state.copyWith(tasks: next));
  }

  Future<void> delete(String id) async {
    if (_deleteTask != null) await _deleteTask!.call(id);
    emit(state.copyWith(tasks: state.tasks.where((e) => e.id != id).toList()));
  }
}
