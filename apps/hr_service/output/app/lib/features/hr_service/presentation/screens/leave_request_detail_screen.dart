// [generated] generator=ScreenGenerator template=screen_detail_bloc_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/core/components.dart';
import 'package:rasheed_replica_hr_service/core/theme.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/state/leave_request_list.dart';



import 'package:rasheed_replica_hr_service/core/app_strings.dart';

class LeaveRequestDetailScreen extends StatefulWidget {
  const LeaveRequestDetailScreen({super.key});

  @override
  State<LeaveRequestDetailScreen> createState() => _LeaveRequestDetailScreenState();
}

class _LeaveRequestDetailScreenState extends State<LeaveRequestDetailScreen> {
  bool _scrolled = false;
  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text('Leave Request details', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: AppType.titleWeightStrong)), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null,
      actions: [
        IconButton(tooltip: AppStrings.of(context).edit, icon: const Icon(Icons.edit), onPressed: () => context.push('/leave-request/${id}/edit')),
        PopupMenuButton<String>(
          icon: const Icon(Icons.more_vert),
          tooltip: 'More actions',
          onSelected: (value) {
            if (value == 'delete') (() async {
            final confirmed = await showDialog<bool>(
              context: context,
              builder: (_) => AlertDialog(
                title: Text('Delete LeaveRequest?'),
                content: const Text('This action cannot be undone.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context, false), child: Text(AppStrings.of(context).cancel)),
                  FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(AppStrings.of(context).delete)),
                ],
              ),
            );
            if (confirmed != true || !context.mounted) return;
            await context.read<LeaveRequestListCubit>().delete(id!);
            if (context.mounted) context.go('/leave-request');
          })();
            if (value == 'audit') (() => context.push('/audit-log'))();
          },
          itemBuilder: (_) => [
            PopupMenuItem(value: 'delete', child: Row(children: [Icon(Icons.delete), const SizedBox(width: AppSpacing.sm), Text(AppStrings.of(context).delete)])),
            PopupMenuItem(value: 'audit', child: Row(children: [Icon(Icons.history), const SizedBox(width: AppSpacing.sm), Text(AppStrings.of(context).audit)])),
          ],
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
        if (state.status == LeaveRequestListStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.leaveRequests.isEmpty) return Center(child: Text(AppStrings.of(context).noData));
            final item = state.leaveRequests.firstWhere((e) => e.id == id, orElse: () => state.leaveRequests.first);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.sm, AppSpacing.sm, AppSpacing.sm, AppSpacing.xl),
          child: Text('Leave request', style: Theme.of(context).textTheme.headlineMedium),
        ),
              Text(item.name, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: AppSpacing.sm),
              Row(children: [
                AppChip(label: item.status.name, tone: AppChip.toneForStatus(item.status.name)),
              ]),
              const SizedBox(height: AppSpacing.sm),
              Row(children: [
                const Icon(Icons.calendar_today, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: AppSpacing.xs),
                Text('Start Date', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(width: AppSpacing.xs),
                Flexible(child: Text((item.startDate.toIso8601String().split('T').first), style: Theme.of(context).textTheme.bodyMedium, overflow: TextOverflow.ellipsis)),
              ]),
              const SizedBox(height: AppSpacing.sm),
              Row(children: [
                const Icon(Icons.calendar_today, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: AppSpacing.xs),
                Text('End Date', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(width: AppSpacing.xs),
                Flexible(child: Text((item.endDate.toIso8601String().split('T').first), style: Theme.of(context).textTheme.bodyMedium, overflow: TextOverflow.ellipsis)),
              ]),
              const SizedBox(height: AppSpacing.sm),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Leave Type', style: Theme.of(context).textTheme.bodySmall),
                Text(item.leaveType.name, style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: AppSpacing.sm),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Days', style: Theme.of(context).textTheme.bodySmall),
                Text(item.days.toString(), style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: AppSpacing.sm),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Reason', style: Theme.of(context).textTheme.bodySmall),
                Text(item.reason ?? '—', style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: AppSpacing.sm),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Exported', style: Theme.of(context).textTheme.bodySmall),
                Text((item.exported ? 'yes' : 'no'), style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: AppSpacing.sm),
              AppListCard(card: true, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.id, style: Theme.of(context).textTheme.labelSmall), radius: AppRadius.sharpSurface, contentPadding: EdgeInsets.all(AppSpacing.sm)),
              const SizedBox(height: AppSpacing.sm),
              AppListCard(card: true, title: Text('View Approvals'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/approval?leaveRequestId=${id}'), radius: AppRadius.sharpSurface, contentPadding: EdgeInsets.all(AppSpacing.sm)),
              ],
            );
        },
        ),
      ),
    );
  }
}
