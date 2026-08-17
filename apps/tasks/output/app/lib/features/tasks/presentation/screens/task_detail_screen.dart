// [generated] generator=ScreenGenerator template=screen_detail_bloc_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/task_list.dart';




class TaskDetailScreen extends StatefulWidget {
  const TaskDetailScreen({super.key});

  @override
  State<TaskDetailScreen> createState() => _TaskDetailScreenState();
}

class _TaskDetailScreenState extends State<TaskDetailScreen> {
  bool _scrolled = false;
  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('Task details'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null,
      actions: [
        IconButton(tooltip: 'Edit', icon: const Icon(Icons.edit), onPressed: () => context.push('/task/${id}/edit')),
        IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () async { await context.read<TaskListCubit>().delete(id!); if (context.mounted) context.go('/task'); }),
      ]),
      body: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: BlocBuilder<TaskListCubit, TaskListState>(
        builder: (context, state) {
        if (state.status == TaskListStatus.loading) return const LoadingState();
        if (state.status == TaskListStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.tasks.isEmpty) return const Center(child: Text('No data'));
            final item = state.tasks.firstWhere((e) => e.id == id, orElse: () => state.tasks.first);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [

              Text(item.title, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4.0),
              Row(children: [
                AppChip(label: item.status.name, tone: AppChip.toneForStatus(item.status.name)),
                const SizedBox(width: AppSpacing.sm),
                AppChip(label: item.priority.name, tone: AppChip.toneForPriority(item.priority.name)),
              ]),
              const SizedBox(height: 4.0),
              Row(children: [
                const Icon(Icons.calendar_today, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: AppSpacing.xs),
                Text('Due Date', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(width: AppSpacing.xs),
                Text(((item.dueDate?.toIso8601String() ?? '').split('T').first), style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: 4.0),
              Text(item.description ?? '—', style: Theme.of(context).textTheme.bodyMedium),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.id, style: Theme.of(context).textTheme.labelSmall)),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('View FollowUps'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/follow-up?taskId=${id}')),
              ],
            );
        },
        ),
      ),
    );
  }
}
