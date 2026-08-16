// [generated] generator=ScreenGenerator template=screen_detail_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_work_auth/core/components.dart';
import 'package:rasheed_replica_work_auth/core/theme.dart';
import 'package:rasheed_replica_work_auth/features/work_auth/presentation/state/visa_quota_list.dart';


import 'package:rasheed_replica_work_auth/core/budget.dart';

class VisaQuotaDetailScreen extends StatelessWidget {
  const VisaQuotaDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('Visa Quota details'),
      actions: [
        IconButton(tooltip: 'Edit', icon: const Icon(Icons.edit), onPressed: () => context.push('/visa-quota/${id}/edit')),
        IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () async { await context.read<VisaQuotaListCubit>().delete(id!); if (context.mounted) context.go('/visa-quota'); }),
      ]),
      body: BlocBuilder<VisaQuotaListCubit, VisaQuotaListState>(
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
              const SizedBox(height: 4.0),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Limit', style: Theme.of(context).textTheme.bodySmall),
                Text(item.limit.format(), style: Theme.of(context).textTheme.labelMedium),
              ]),
              const SizedBox(height: 4.0),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Committed', style: Theme.of(context).textTheme.bodySmall),
                Text(item.committed.format(), style: Theme.of(context).textTheme.labelMedium),
              ]),
              const SizedBox(height: 4.0),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Actual', style: Theme.of(context).textTheme.bodySmall),
                Text(item.actual.format(), style: Theme.of(context).textTheme.labelMedium),
              ]),
              const SizedBox(height: 4.0),
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
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.id, style: Theme.of(context).textTheme.labelSmall)),
              ],
            );
        },
      ),
    );
  }
}
