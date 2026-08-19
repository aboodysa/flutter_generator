// [generated] generator=ScreenGenerator template=screen_list_bloc_search_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_choice_demo/core/components.dart';
import 'package:rasheed_replica_choice_demo/core/theme.dart';
import 'package:rasheed_replica_choice_demo/features/choice_demo/presentation/state/pick_list.dart';




class PickListScreen extends StatefulWidget {
  const PickListScreen({super.key});

  @override
  State<PickListScreen> createState() => _PickListScreenState();
}

class _PickListScreenState extends State<PickListScreen> {
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
      appBar: AppBar(title: const Text('Picks'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null),
      body: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: BlocBuilder<PickListCubit, PickListState>(
        builder: (context, state) {
        if (state.status == PickListStatus.loading) return const LoadingState();
        if (state.status == PickListStatus.failure) return ErrorState(message: state.errorMessage, onRetry: () => context.read<PickListCubit>().load());
    final items = state.picks;
            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? items : items.where((item) => (item.label).toLowerCase().contains(query)).toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 0),
                  child: SearchBar(
                    controller: _searchController,
                    focusNode: _searchFocus,
                    onTap: () => _searchFocus.requestFocus(),
                    hintText: 'Search Picks',
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
                      ? EmptyState(message: 'No Picks yet',
                        action: OutlinedButton(onPressed: () => context.push('/pick/new'), child: Text('New Pick')))
                      : filtered.isEmpty && query.isNotEmpty
                      ? EmptyState(message: 'No results for "$_query"')
                      : RefreshIndicator(
                    onRefresh: () => context.read<PickListCubit>().load(),
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
                            padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                            child: AppListCard(
                              key: ValueKey(item.id),
                              card: true,
                              leading: AppAvatar(label: item.label),
                              title: Text(item.label),
                              subtitle: Text('${item.answer.name} · ${item.mood.name}'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.push('/pick/${item.id}/edit'),
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
        tooltip: 'New Pick',
        onPressed: () => context.push('/pick/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
