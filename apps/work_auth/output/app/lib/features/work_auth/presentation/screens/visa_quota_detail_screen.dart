// [generated] generator=ScreenGenerator template=screen_detail_bloc_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/core/components.dart';
import 'package:rasheed_replica_work_auth/core/theme.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/state/visa_quota_list.dart';


import 'package:rasheed_replica_work_auth/core/budget.dart';

class VisaQuotaDetailScreen extends StatefulWidget {
  const VisaQuotaDetailScreen({super.key});

  @override
  State<VisaQuotaDetailScreen> createState() => _VisaQuotaDetailScreenState();
}

class _VisaQuotaDetailScreenState extends State<VisaQuotaDetailScreen> {
  bool _scrolled = false;
  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('Visa Quota details'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null,
      actions: [
        IconButton(tooltip: 'Edit', icon: const Icon(Icons.edit), onPressed: () => context.push('/visa-quota/${id}/edit')),
        IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () async {
            final confirmed = await showDialog<bool>(
              context: context,
              builder: (_) => AlertDialog(
                title: Text('Delete VisaQuota?'),
                content: const Text('This action cannot be undone.'),
                actions: [
                  TextButton(onPressed: () => Navigator.pop(context, false), child: Text('Cancel')),
                  FilledButton(onPressed: () => Navigator.pop(context, true), child: Text('Delete')),
                ],
              ),
            );
            if (confirmed != true || !context.mounted) return;
            await context.read<VisaQuotaListCubit>().delete(id!);
            if (context.mounted) context.go('/visa-quota');
          }),
      ]),
      body: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: BlocBuilder<VisaQuotaListCubit, VisaQuotaListState>(
        builder: (context, state) {
        if (state.status == VisaQuotaListStatus.loading) return const LoadingState();
        if (state.status == VisaQuotaListStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.visaQuotas.isEmpty) return const Center(child: Text('No data'));
            final item = state.visaQuotas.firstWhere((e) => e.id == id, orElse: () => state.visaQuotas.first);
            final budget = BudgetLine(scope: item.name, limit: item.limit, committed: item.committed, actual: item.actual);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [

              Text(item.name, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: AppSpacing.xs),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Limit', style: Theme.of(context).textTheme.bodySmall),
                Text(item.limit.format(), style: Theme.of(context).textTheme.labelMedium),
              ]),
              const SizedBox(height: AppSpacing.xs),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Committed', style: Theme.of(context).textTheme.bodySmall),
                Text(item.committed.format(), style: Theme.of(context).textTheme.labelMedium),
              ]),
              const SizedBox(height: AppSpacing.xs),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Actual', style: Theme.of(context).textTheme.bodySmall),
                Text(item.actual.format(), style: Theme.of(context).textTheme.labelMedium),
              ]),
              const SizedBox(height: AppSpacing.xs),
              Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                  Text('Remaining', style: Theme.of(context).textTheme.bodySmall),
                  Text(budget.remaining.format(), style: Theme.of(context).textTheme.labelMedium),
                ]),
                const SizedBox(height: AppSpacing.xs),
                Text('used ${(budget.pctUsed * 100).round()}%', style: Theme.of(context).textTheme.bodySmall),
                if (budget.isOverLimit) ...[
                  const SizedBox(height: AppSpacing.xs),
                  const AppChip(label: 'Over budget', tone: AppChipTone.danger),
                ],
              ]),
              const SizedBox(height: AppSpacing.xs),
              AppListCard(card: true, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.id, style: Theme.of(context).textTheme.labelSmall)),
              ],
            );
        },
        ),
      ),
    );
  }
}
