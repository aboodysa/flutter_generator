// [generated] generator=ScreenGenerator template=screen_list_bloc_search_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/presentation/state/approval_list.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval.dart';
import 'package:rasheed_replica_ledgerly/features/approvals/domain/entities/approval_decision.dart';



class ApprovalListScreen extends StatefulWidget {
  const ApprovalListScreen({super.key});

  @override
  State<ApprovalListScreen> createState() => _ApprovalListScreenState();
}

class _ApprovalListScreenState extends State<ApprovalListScreen> {
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
      appBar: AppBar(title: const Text('Approvals'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null),
      body: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: BlocBuilder<ApprovalListCubit, ApprovalListState>(
        builder: (context, state) {
        if (state.status == ApprovalListStatus.loading) return const LoadingState();
        if (state.status == ApprovalListStatus.failure) return ErrorState(message: state.errorMessage, onRetry: () => context.read<ApprovalListCubit>().load());
    final items = state.approvals;
            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? items : items.where((item) => (item.name).toLowerCase().contains(query)).toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 0),
                  child: SearchBar(
                    controller: _searchController,
                    hintText: 'Search Approvals',
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
                      ? EmptyState(message: 'No Approvals yet')
                      : filtered.isEmpty && query.isNotEmpty
                      ? EmptyState(message: 'No results for "$_query"')
                      : RefreshIndicator(
                    onRefresh: () => context.read<ApprovalListCubit>().load(),
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
                              leading: AppStatusDot(tone: AppChip.toneForStatus(item.decision.name), semanticLabel: item.decision.name),
                              title: Text(item.name),
                              subtitle: Text('${item.decision.name}'),
                              trailing: Row(mainAxisSize: MainAxisSize.min, children: [
                                for (final v in ApprovalDecision.values.where((v) => v != item.decision))
                                  IconButton(
                                    tooltip: v.name,
                                    icon: Icon(AppChip.toneForStatus(v.name) == AppChipTone.danger ? Icons.close : Icons.check, color: AppChip.colorForTone(context, AppChip.toneForStatus(v.name))),
                                    onPressed: () => context.read<ApprovalListCubit>().update(Approval(id: item.id, name: item.name, decision: v)),
                                  ),
                              ]),
                              onTap: null,
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
    );
  }
}
