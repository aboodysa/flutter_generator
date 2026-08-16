// [generated] generator=ScreenGenerator template=screen_list_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/core/components.dart';
import 'package:rasheed_replica_hr_service/core/theme.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/state/leave_request_list.dart';



import 'package:rasheed_replica_hr_service/core/export.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/domain/entities/leave_request.dart';

class LeaveRequestListScreen extends StatelessWidget {
  const LeaveRequestListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Leave Requests'),
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
      body: BlocBuilder<LeaveRequestListCubit, LeaveRequestListState>(
        builder: (context, state) {
        if (state.status == LeaveRequestListStatus.loading) return const LoadingState();
        if (state.status == LeaveRequestListStatus.failure) return ErrorState(message: state.errorMessage);
    final items = state.leaveRequests;
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
              ],
            );
        },
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: 'New LeaveRequest',
        onPressed: () => context.push('/leave-request/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
