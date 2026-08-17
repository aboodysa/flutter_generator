// [generated] generator=ScreenGenerator template=screen_list_bloc_search_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/core/components.dart';
import 'package:rasheed_replica_work_auth/core/theme.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/state/work_auth_list.dart';




class WorkAuthListScreen extends StatefulWidget {
  const WorkAuthListScreen({super.key});

  @override
  State<WorkAuthListScreen> createState() => _WorkAuthListScreenState();
}

class _WorkAuthListScreenState extends State<WorkAuthListScreen> {
  final _searchController = TextEditingController();
  String _query = '';
  bool _scrolled = false;
  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Work Auths'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null),
      body: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: BlocBuilder<WorkAuthListCubit, WorkAuthListState>(
        builder: (context, state) {
        if (state.status == WorkAuthListStatus.loading) return const LoadingState();
        if (state.status == WorkAuthListStatus.failure) return ErrorState(message: state.errorMessage, onRetry: () => context.read<WorkAuthListCubit>().load());
    final items = state.workAuths;
            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? items : items.where((item) => (item.name).toLowerCase().contains(query)).toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 0),
                  child: SearchBar(
                    controller: _searchController,
                    hintText: 'Search Work Auths',
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
                  child: items.isEmpty
                      ? EmptyState(message: 'No Work Auths yet',
                        action: OutlinedButton(onPressed: () => context.push('/work-auth/new'), child: Text('New WorkAuth')))
                      : filtered.isEmpty && query.isNotEmpty
                      ? EmptyState(message: 'No results for "$_query"')
                      : RefreshIndicator(
                    onRefresh: () => context.read<WorkAuthListCubit>().load(),
                    child: ScrollConfiguration(
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
                              leading: AppStatusDot(tone: AppChip.toneForStatus(item.status.name), semanticLabel: item.status.name),
                              title: Text(item.name),
                              subtitle: Text('${(item.startDate.toIso8601String().split('T').first)} · ${item.durationDays.toString()}'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.push('/work-auth/${item.id}/edit'),
                            ),
                          );
                        },
                      ),
                    ),
                  ),
                  ),
                ),
              ],
            );
        },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'New WorkAuth',
        onPressed: () => context.push('/work-auth/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
