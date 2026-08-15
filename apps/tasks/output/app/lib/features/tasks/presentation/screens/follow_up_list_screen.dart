// [generated] generator=ScreenGenerator template=screen_list_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/follow_up_list.dart';


class FollowUpListScreen extends StatelessWidget {
  const FollowUpListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('FollowUpListScreen')),
      body: BlocBuilder<FollowUpListCubit, FollowUpListState>(
        builder: (context, state) {
        if (state.status == FollowUpListStatus.loading) return const LoadingState();
        if (state.status == FollowUpListStatus.failure) return ErrorState(message: state.errorMessage);
    final qp = GoRouterState.of(context).uri.queryParameters;
    final items = qp.containsKey('taskId')
        ? state.followUps.where((e) => e.taskId == qp['taskId']).toList()
        : state.followUps;
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
                          leading: AppAvatar(label: item.id),
                          title: Text(item.id),
                          subtitle: Text('${((item.createdAt?.toIso8601String() ?? '').split('T').first)}'),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => context.go('/follow-up/${item.id}'),
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
        tooltip: 'New FollowUp',
        onPressed: () => context.go('/follow-up/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
