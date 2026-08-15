// [generated] generator=ScreenGenerator template=screen_detail_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/task_list.dart';


class TaskDetailScreen extends StatelessWidget {
  const TaskDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('TaskDetailScreen'),
      actions: [
        IconButton(tooltip: 'Edit', icon: const Icon(Icons.edit), onPressed: () => context.go('/task/${id}/edit')),
        IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () async { await context.read<TaskListCubit>().delete(id!); if (context.mounted) context.go('/task'); }),
      ]),
      body: BlocBuilder<TaskListCubit, TaskListState>(
        builder: (context, state) {
        if (state.status == TaskListStatus.loading) return const LoadingState();
        if (state.status == TaskListStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.tasks.isEmpty) return const Center(child: Text('No data'));
            final item = state.tasks.firstWhere((e) => e.id == id, orElse: () => state.tasks.first);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [

              AppListCard(card: true, title: Text('Id'), trailing: Text(item.id)),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Title'), trailing: Text(item.title)),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Description'), trailing: Text(item.description ?? '—')),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Due Date'), trailing: Text(((item.dueDate?.toIso8601String() ?? '').split('T').first))),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Priority'), trailing: Text(item.priority.name)),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Status'), trailing: Text(item.status.name)),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('View FollowUps'), trailing: const Icon(Icons.chevron_right), onTap: () => context.go('/follow-up?taskId=${id}')),
              ],
            );
        },
      ),
    );
  }
}
