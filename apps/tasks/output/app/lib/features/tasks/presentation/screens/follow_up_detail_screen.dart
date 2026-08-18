// [generated] generator=ScreenGenerator template=screen_detail_bloc_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/follow_up_list.dart';




class FollowUpDetailScreen extends StatefulWidget {
  const FollowUpDetailScreen({super.key});

  @override
  State<FollowUpDetailScreen> createState() => _FollowUpDetailScreenState();
}

class _FollowUpDetailScreenState extends State<FollowUpDetailScreen> {
  bool _scrolled = false;
  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('Follow Up details'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null,
      actions: [
        IconButton(tooltip: 'Edit', icon: const Icon(Icons.edit), onPressed: () => context.push('/follow-up/${id}/edit')),
        IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () async {
            final confirmed = await showDialog<bool>(
              context: context,
              builder: (_) => AlertDialog(
                title: Text('Delete FollowUp?'),
                content: const Text('This action cannot be undone.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel')),
                  FilledButton(onPressed: () => Navigator.pop(context, true), child: Text('Delete')),
                ],
              ),
            );
            if (confirmed != true || !context.mounted) return;
            await context.read<FollowUpListCubit>().delete(id!);
            if (context.mounted) context.go('/follow-up');
          }),
      ]),
      body: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: BlocBuilder<FollowUpListCubit, FollowUpListState>(
        builder: (context, state) {
        if (state.status == FollowUpListStatus.loading) return const LoadingState();
        if (state.status == FollowUpListStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.followUps.isEmpty) return const Center(child: Text('No data'));
            final item = state.followUps.firstWhere((e) => e.id == id, orElse: () => state.followUps.first);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [

              Text(item.subject, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4.0),
              Row(children: [
                const Icon(Icons.calendar_today, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: AppSpacing.xs),
                Text('Created At', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(width: AppSpacing.xs),
                Flexible(child: Text(((item.createdAt?.toIso8601String() ?? '').split('T').first), style: Theme.of(context).textTheme.bodyMedium, overflow: TextOverflow.ellipsis)),
              ]),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.id, style: Theme.of(context).textTheme.labelSmall)),
              ],
            );
        },
        ),
      ),
    );
  }
}
