// [generated] generator=ScreenGenerator template=screen_list_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/core/components.dart';
import 'package:rasheed_replica_hr_service/core/theme.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/state/approval_list.dart';




class ApprovalListScreen extends StatelessWidget {
  const ApprovalListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Approvals')),
      body: BlocBuilder<ApprovalListCubit, ApprovalListState>(
        builder: (context, state) {
        if (state.status == ApprovalListStatus.loading) return const LoadingState();
        if (state.status == ApprovalListStatus.failure) return ErrorState(message: state.errorMessage);
    final qp = GoRouterState.of(context).uri.queryParameters;
    final items = qp.containsKey('leaveRequestId')
        ? state.approvals.where((e) => e.leaveRequestId == qp['leaveRequestId']).toList()
        : state.approvals;
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [

                Expanded(
                  // RCA-006: AppScrollBehavior opts every input device (touch/mouse/trackpad/
                  // stylus) into drag-to-scroll — Flutter's default excludes mouse, which is why
                  // a real mouse-drag never scrolled this list even though touch always did.
                  // Scrollbar(thumbVisibility: true) makes the list's scrollability visible up
                  // front, not just discoverable by already dragging (the owner's "no scroller"
                  // report) — AlwaysScrollableScrollPhysics keeps the list draggable/bouncable
                  // even on the rare screen where content doesn't yet overflow.
                  child: ScrollConfiguration(
                    behavior: const AppScrollBehavior(),
                    child: Scrollbar(
                      thumbVisibility: true,
                      child: ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
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
                              subtitle: Text('${((item.decidedAt?.toIso8601String() ?? '').split('T').first)}'),
                              trailing: IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () => context.read<ApprovalListCubit>().delete(item.id)),
                              onTap: () => context.push('/approval/${item.id}/edit'),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                ),
              ],
            );
        },
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'New Approval',
        onPressed: () {
          final id = GoRouterState.of(context).uri.queryParameters['leaveRequestId'];
          context.push(id != null ? '/approval/new?leaveRequestId=$id' : '/approval/new');
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
