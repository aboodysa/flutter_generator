// [generated] generator=ScreenGenerator template=screen_list_bloc_search.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/follow_up_list.dart';




class FollowUpListScreen extends StatefulWidget {
  const FollowUpListScreen({super.key});

  @override
  State<FollowUpListScreen> createState() => _FollowUpListScreenState();
}

class _FollowUpListScreenState extends State<FollowUpListScreen> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Follow Ups')),
      body: BlocBuilder<FollowUpListCubit, FollowUpListState>(
        builder: (context, state) {
        if (state.status == FollowUpListStatus.loading) return const LoadingState();
        if (state.status == FollowUpListStatus.failure) return ErrorState(message: state.errorMessage);
    final qp = GoRouterState.of(context).uri.queryParameters;
    final items = qp.containsKey('taskId')
        ? state.followUps.where((e) => e.taskId == qp['taskId']).toList()
        : state.followUps;
            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? items : items.where((item) => (item.subject).toLowerCase().contains(query)).toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 0),
                  child: SearchBar(
                    controller: _searchController,
                    hintText: 'Search Follow Ups',
                    leading: const Icon(Icons.search),
                    onChanged: (v) => setState(() => _query = v),
                  ),
                ),

                Expanded(
                  // RCA-006: AppScrollBehavior opts every input device (touch/mouse/trackpad/
                  // stylus) into drag-to-scroll — Flutter's default excludes mouse, which is why
                  // a real mouse-drag never scrolled this list even though touch always did.
                  // Scrollbar(thumbVisibility: true) makes the list's scrollability visible up
                  // front, not just discoverable by already dragging (the owner's "no scroller"
                  // report) — AlwaysScrollableScrollPhysics keeps the list draggable/bouncable
                  // even on the rare screen where content doesn't yet overflow.
                  child: filtered.isEmpty && query.isNotEmpty
                      ? EmptyState(message: 'No results for "$_query"')
                      : ScrollConfiguration(
                    behavior: const AppScrollBehavior(),
                    child: Scrollbar(
                      thumbVisibility: true,
                      child: ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                        itemCount: filtered.length,
                        itemBuilder: (_, i) {
                          final item = filtered[i];
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: AppListCard(
                              key: ValueKey(item.id),
                              card: true,
                              leading: AppAvatar(label: item.subject),
                              title: Text(item.subject),
                              subtitle: Text('${((item.createdAt?.toIso8601String() ?? '').split('T').first)}'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.push('/follow-up/${item.id}'),
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
        tooltip: 'New FollowUp',
        onPressed: () {
          final id = GoRouterState.of(context).uri.queryParameters['taskId'];
          context.push(id != null ? '/follow-up/new?taskId=$id' : '/follow-up/new');
        },
        child: const Icon(Icons.add),
      ),
    );
  }
}
