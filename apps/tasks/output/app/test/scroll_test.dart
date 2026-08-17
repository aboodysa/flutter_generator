// [generated] generator=ScrollTestGenerator template=scroll_test_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/generated.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';

class _NoOpTaskRepository implements TaskRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededTaskListCubit extends TaskListCubit {
  _SeededTaskListCubit() : super(ListTasks(_NoOpTaskRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: TaskListStatus.success,
      tasks: [
        Task(id: 'task-1', title: 'Sample Task 1', description: 'Sample item 1', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-2', title: 'Sample Task 2', description: 'Sample item 2', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-3', title: 'Sample Task 3', description: 'Sample item 3', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-4', title: 'Sample Task 4', description: 'Sample item 4', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-5', title: 'Sample Task 5', description: 'Sample item 5', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-6', title: 'Sample Task 6', description: 'Sample item 6', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-7', title: 'Sample Task 7', description: 'Sample item 7', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-8', title: 'Sample Task 8', description: 'Sample item 8', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-9', title: 'Sample Task 9', description: 'Sample item 9', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-10', title: 'Sample Task 10', description: 'Sample item 10', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-11', title: 'Sample Task 11', description: 'Sample item 11', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-12', title: 'Sample Task 12', description: 'Sample item 12', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-13', title: 'Sample Task 13', description: 'Sample item 13', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-14', title: 'Sample Task 14', description: 'Sample item 14', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
        Task(id: 'task-15', title: 'Sample Task 15', description: 'Sample item 15', dueDate: DateTime(2025), priority: Priority.values.first, status: TaskStatus.values.first),
      ],
    ));
  }
}

class _NoOpFollowUpRepository implements FollowUpRepository {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _SeededFollowUpListCubit extends FollowUpListCubit {
  _SeededFollowUpListCubit() : super(ListFollowUps(_NoOpFollowUpRepository()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: FollowUpListStatus.success,
      followUps: [
        FollowUp(id: 'follow-up-1', taskId: 'Sample item 1', subject: 'Sample FollowUp 1', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-2', taskId: 'Sample item 2', subject: 'Sample FollowUp 2', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-3', taskId: 'Sample item 3', subject: 'Sample FollowUp 3', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-4', taskId: 'Sample item 4', subject: 'Sample FollowUp 4', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-5', taskId: 'Sample item 5', subject: 'Sample FollowUp 5', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-6', taskId: 'Sample item 6', subject: 'Sample FollowUp 6', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-7', taskId: 'Sample item 7', subject: 'Sample FollowUp 7', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-8', taskId: 'Sample item 8', subject: 'Sample FollowUp 8', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-9', taskId: 'Sample item 9', subject: 'Sample FollowUp 9', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-10', taskId: 'Sample item 10', subject: 'Sample FollowUp 10', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-11', taskId: 'Sample item 11', subject: 'Sample FollowUp 11', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-12', taskId: 'Sample item 12', subject: 'Sample FollowUp 12', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-13', taskId: 'Sample item 13', subject: 'Sample FollowUp 13', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-14', taskId: 'Sample item 14', subject: 'Sample FollowUp 14', createdAt: DateTime(2025)),
        FollowUp(id: 'follow-up-15', taskId: 'Sample item 15', subject: 'Sample FollowUp 15', createdAt: DateTime(2025)),
      ],
    ));
  }
}

void main() {
  testWidgets('TaskListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<TaskListCubit>(
      create: (_) => _SeededTaskListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const TaskListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('task-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('task-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });

  testWidgets('FollowUpListScreen: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<FollowUpListCubit>(
      create: (_) => _SeededFollowUpListCubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const FollowUpListScreen())])),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('follow-up-15')), findsNothing, reason: 'row 15 should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('follow-up-15')), findsOneWidget, reason: 'row 15 should be reachable after dragging up');
  });
}
