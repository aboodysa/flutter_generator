// [generated] generator=ScreenGenerator template=screen_detail_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/follow_up_list.dart';


class FollowUpDetailScreen extends StatelessWidget {
  const FollowUpDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('Follow Up details'),
      actions: [
        IconButton(tooltip: 'Edit', icon: const Icon(Icons.edit), onPressed: () => context.go('/follow-up/${id}/edit')),
        IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () async { await context.read<FollowUpListCubit>().delete(id!); if (context.mounted) context.go('/follow-up'); }),
      ]),
      body: BlocBuilder<FollowUpListCubit, FollowUpListState>(
        builder: (context, state) {
        if (state.status == FollowUpListStatus.loading) return const LoadingState();
        if (state.status == FollowUpListStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.followUps.isEmpty) return const Center(child: Text('No data'));
            final item = state.followUps.firstWhere((e) => e.id == id, orElse: () => state.followUps.first);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [

              AppListCard(card: true, title: Text('Task Id'), trailing: Text(item.taskId)),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Note'), trailing: Text(item.note)),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Created At'), trailing: Text(((item.createdAt?.toIso8601String() ?? '').split('T').first))),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.id, style: Theme.of(context).textTheme.labelSmall)),
              ],
            );
        },
      ),
    );
  }
}
