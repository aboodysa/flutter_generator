// [generated] generator=ScreenGenerator template=screen_detail_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_hr_service/core/components.dart';
import 'package:rasheed_replica_hr_service/core/theme.dart';
import 'package:rasheed_replica_hr_service/features/hr_service/presentation/state/leave_request_list.dart';




class LeaveRequestDetailScreen extends StatelessWidget {
  const LeaveRequestDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('Leave Request details'),
      actions: [
        IconButton(tooltip: 'Edit', icon: const Icon(Icons.edit), onPressed: () => context.push('/leave-request/${id}/edit')),
        IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () async { await context.read<LeaveRequestListCubit>().delete(id!); if (context.mounted) context.go('/leave-request'); }),
      ]),
      body: BlocBuilder<LeaveRequestListCubit, LeaveRequestListState>(
        builder: (context, state) {
        if (state.status == LeaveRequestListStatus.loading) return const LoadingState();
        if (state.status == LeaveRequestListStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.leaveRequests.isEmpty) return const Center(child: Text('No data'));
            final item = state.leaveRequests.firstWhere((e) => e.id == id, orElse: () => state.leaveRequests.first);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [

              Text(item.name, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4.0),
              Row(children: [
                AppChip(label: item.status.name, tone: AppChip.toneForStatus(item.status.name)),
              ]),
              const SizedBox(height: 4.0),
              Row(children: [
                const Icon(Icons.calendar_today, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: AppSpacing.xs),
                Text('Start Date', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(width: AppSpacing.xs),
                Text((item.startDate.toIso8601String().split('T').first), style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: 4.0),
              Row(children: [
                const Icon(Icons.calendar_today, size: 16, color: AppColors.textSecondary),
                const SizedBox(width: AppSpacing.xs),
                Text('End Date', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(width: AppSpacing.xs),
                Text((item.endDate.toIso8601String().split('T').first), style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: 4.0),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Leave Type', style: Theme.of(context).textTheme.bodySmall),
                Text(item.leaveType.name, style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: 4.0),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Days', style: Theme.of(context).textTheme.bodySmall),
                Text(item.days.toString(), style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: 4.0),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Reason', style: Theme.of(context).textTheme.bodySmall),
                Text(item.reason ?? '—', style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: 4.0),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Exported', style: Theme.of(context).textTheme.bodySmall),
                Text((item.exported ? 'yes' : 'no'), style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.id, style: Theme.of(context).textTheme.labelSmall)),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('View Approvals'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/approval?leaveRequestId=${id}')),
              ],
            );
        },
      ),
    );
  }
}
