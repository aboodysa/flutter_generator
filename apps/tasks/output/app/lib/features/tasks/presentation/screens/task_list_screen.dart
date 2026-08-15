// [generated] generator=ScreenGenerator template=screen_list_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/task_list.dart';


class TaskListScreen extends StatelessWidget {
  const TaskListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('TaskListScreen')),
      body: BlocBuilder<TaskListCubit, TaskListState>(
        builder: (context, state) {
        if (state.status == TaskListStatus.loading) return const LoadingState();
        if (state.status == TaskListStatus.failure) return ErrorState(message: state.errorMessage);
    final items = state.tasks;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [

                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final item = items[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: 8.0),
                        child: AppListCard(
                          key: ValueKey(item.id),
                          card: true,
                          leading: AppAvatar(label: item.title),
                          title: Text(item.title),
                          subtitle: Text('${((item.dueDate?.toIso8601String() ?? '').split('T').first)} · ${item.priority.name}'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => context.go('/task/${item.id}'),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );
        },
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'New Task',
        onPressed: () => context.go('/task/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
