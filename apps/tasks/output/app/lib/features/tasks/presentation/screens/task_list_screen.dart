// [generated] generator=ScreenGenerator template=screen_list_bloc_search_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/state/task_list.dart';




class TaskListScreen extends StatefulWidget {
  const TaskListScreen({super.key});

  @override
  State<TaskListScreen> createState() => _TaskListScreenState();
}

class _TaskListScreenState extends State<TaskListScreen> {
  final _searchController = TextEditingController();
  final _searchFocus = FocusNode();
  String _query = '';
  bool _scrolled = false;
  @override
  void dispose() {
    _searchController.dispose();
    _searchFocus.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Tasks'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null),
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
        if (state.status == TaskListStatus.failure) return ErrorState(message: state.errorMessage, onRetry: () => context.read<TaskListCubit>().load());
    final items = state.tasks;
            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? items : items.where((item) => (item.title).toLowerCase().contains(query)).toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 0),
                  child: SearchBar(
                    controller: _searchController,
                    focusNode: _searchFocus,
                    onTap: () => _searchFocus.requestFocus(),
                    hintText: 'Search Tasks',
                    leading: const Icon(Icons.search),
                    onChanged: (v) => setState(() => _query = v), shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.roundedSearch))),
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
                      ? EmptyState(message: 'No Tasks yet',
                        action: OutlinedButton(onPressed: () => context.push('/task/new'), child: Text('New Task')))
                      : filtered.isEmpty && query.isNotEmpty
                      ? EmptyState(message: 'No results for "$_query"')
                      : RefreshIndicator(
                    onRefresh: () => context.read<TaskListCubit>().load(),
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
                            padding: const EdgeInsets.only(bottom: AppSpacing.md),
                            child: AppListCard(
                              key: ValueKey(item.id),
                              card: true,
                              leading: AppStatusDot(tone: AppChip.toneForStatus(item.status.name), semanticLabel: item.status.name),
                              title: Text(item.title),
                              subtitle: Text('${((item.dueDate?.toIso8601String() ?? '').split('T').first)} · ${item.priority.name}'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.push('/task/${item.id}'), radius: AppRadius.roundedSurface, contentPadding: EdgeInsets.all(AppSpacing.md),
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
      floatingActionButton: Padding(
        padding: EdgeInsets.all(AppSpacing.md),
        child: FloatingActionButton(
        tooltip: 'New Task',
        onPressed: () => context.push('/task/new'),
        child: const Icon(Icons.add), shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(AppRadius.roundedFab)),
      ),
      ),
    );
  }
}
