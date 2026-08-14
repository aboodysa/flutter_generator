// [generated] generator=StateGenerator template=state_enum_status.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:equatable/equatable.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/domain/entities/priority.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/domain/entities/task.dart';

enum TaskListStatus { initial, loading, success, failure }

class TaskListState extends Equatable {
  final TaskListStatus status;
  final List<Task> transactions;
  final String? errorMessage;

  const TaskListState({
    this.status = TaskListStatus.initial,
    this.transactions = const [],
    this.errorMessage,
  });

  TaskListState copyWith({
    TaskListStatus? status,
    List<Task>? transactions,
    String? errorMessage,
  }) => TaskListState(
    status: status ?? this.status,
    transactions: transactions ?? this.transactions,
    errorMessage: errorMessage,
  );

  @override
  List<Object?> get props => [status, transactions, errorMessage];
}

class TaskListCubit extends Cubit<TaskListState> {
  TaskListCubit() : super(const TaskListState());

  Future<void> load() async {
    emit(state.copyWith(status: TaskListStatus.loading));
    try {
      // [user] region:user — replace with real repository call.
      // Deterministic demo data so the app renders rows out of the box:
      emit(state.copyWith(status: TaskListStatus.success, transactions: [Task(id: 'x', title: 'x', dueDate: DateTime(2024), priority: Priority.values.first, isDone: false)]));
    } catch (e) {
      emit(state.copyWith(status: TaskListStatus.failure, errorMessage: e.toString()));
    }
  }
}
