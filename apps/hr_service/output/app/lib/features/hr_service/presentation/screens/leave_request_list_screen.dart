// [generated] generator=ScreenGenerator template=screen_list_bloc_search_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/core/components.dart';
import 'package:rasheed_replica_hr_service/core/theme.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/state/leave_request_list.dart';



import 'package:rasheed_replica_hr_service/core/export.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';
import 'package:rasheed_replica_hr_service/core/app_strings.dart';

class LeaveRequestListScreen extends StatefulWidget {
  const LeaveRequestListScreen({super.key});

  @override
  State<LeaveRequestListScreen> createState() => _LeaveRequestListScreenState();
}

class _LeaveRequestListScreenState extends State<LeaveRequestListScreen> {
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
      appBar: AppBar(title: const Text('Leave Requests'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null,
      actions: [
        IconButton(
          tooltip: 'Export CSV',
          icon: const Icon(Icons.download),
          onPressed: () async {
            final rows = context.read<LeaveRequestListCubit>().state.leaveRequests.map((item) => <String, dynamic>{'id': item.id, 'name': item.name, 'leaveType': item.leaveType.name, 'startDate': (item.startDate.toIso8601String().split('T').first), 'endDate': (item.endDate.toIso8601String().split('T').first), 'days': item.days.toString(), 'status': item.status.name, 'reason': item.reason ?? '—', 'exported': (item.exported ? 'yes' : 'no')}).toList();
            final csv = toCsv(rows, const ['id', 'name', 'leaveType', 'startDate', 'endDate', 'days', 'status', 'reason', 'exported']);
            for (final row in context.read<LeaveRequestListCubit>().state.leaveRequests) {
              if (!row.exported) {
                await context.read<LeaveRequestListCubit>().update(LeaveRequest(id: row.id, name: row.name, leaveType: row.leaveType, startDate: row.startDate, endDate: row.endDate, days: row.days, status: row.status, reason: row.reason, exported: true));
              }
            }
            if (context.mounted) {
              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Exported ${rows.length} rows to CSV (${csv.length} chars)')));
            }
          },
        ),
      ]),
      body: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: BlocBuilder<LeaveRequestListCubit, LeaveRequestListState>(
        builder: (context, state) {
        if (state.status == LeaveRequestListStatus.loading) return const LoadingState();
        if (state.status == LeaveRequestListStatus.failure) return ErrorState(message: state.errorMessage, onRetry: () => context.read<LeaveRequestListCubit>().load());
    final items = state.leaveRequests;
            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? items : items.where((item) => (item.name).toLowerCase().contains(query)).toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 0),
                  child: SearchBar(
                    controller: _searchController,
                    hintText: 'Search Leave Requests',
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
                      ? EmptyState(message: 'No Leave Requests yet',
                        action: OutlinedButton(onPressed: () => context.push('/leave-request/new'), child: Text('${AppStrings.of(context).newLabel} LeaveRequest')))
                      : filtered.isEmpty && query.isNotEmpty
                      ? EmptyState(message: 'No results for "$_query"')
                      : RefreshIndicator(
                    onRefresh: () => context.read<LeaveRequestListCubit>().load(),
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
                              leading: AppStatusDot(tone: AppChip.toneForStatus(item.status.name), semanticLabel: item.status.name),
                              title: Text(item.name),
                              subtitle: Text('${item.leaveType.name} · ${(item.startDate.toIso8601String().split('T').first)}'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.push('/leave-request/${item.id}'),
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
        tooltip: '${AppStrings.of(context).newLabel} LeaveRequest',
        onPressed: () => context.push('/leave-request/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
