// [generated] generator=ScreenGenerator template=screen_detail_bloc_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/state/expense_claim_list.dart';

import 'package:rasheed_replica_ledgerly/features/expenses/presentation/state/expense_claim_split_list.dart';

import 'package:rasheed_replica_ledgerly/core/app_strings.dart';

class ExpenseClaimDetailScreen extends StatefulWidget {
  const ExpenseClaimDetailScreen({super.key});

  @override
  State<ExpenseClaimDetailScreen> createState() => _ExpenseClaimDetailScreenState();
}

class _ExpenseClaimDetailScreenState extends State<ExpenseClaimDetailScreen> {
  bool _scrolled = false;
  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('Expense Claim details'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null,
      actions: [
        IconButton(tooltip: AppStrings.of(context).edit, icon: const Icon(Icons.edit), onPressed: () => context.push('/expense-claim/${id}/edit')),
        IconButton(tooltip: AppStrings.of(context).delete, icon: const Icon(Icons.delete), onPressed: () async { await context.read<ExpenseClaimListCubit>().delete(id!); if (context.mounted) context.go('/expense-claim'); }),
      ]),
      body: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: BlocBuilder<ExpenseClaimListCubit, ExpenseClaimListState>(
        builder: (context, state) {
        if (state.status == ExpenseClaimListStatus.loading) return const LoadingState();
        if (state.status == ExpenseClaimListStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.expenseClaims.isEmpty) return Center(child: Text(AppStrings.of(context).noData));
            final item = state.expenseClaims.firstWhere((e) => e.id == id, orElse: () => state.expenseClaims.first);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [

              Text(item.name, style: Theme.of(context).textTheme.headlineMedium),
              const SizedBox(height: 4.0),
              Row(children: [
                AppChip(label: item.status.name, tone: AppChip.toneForStatus(item.status.name)),
              ]),
              const SizedBox(height: 4.0),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Amount', style: Theme.of(context).textTheme.bodySmall),
                Text(item.amount.format(), style: Theme.of(context).textTheme.labelMedium),
              ]),
              const SizedBox(height: 4.0),
              Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                Text('Exported', style: Theme.of(context).textTheme.bodySmall),
                Text((item.exported ? 'yes' : 'no'), style: Theme.of(context).textTheme.bodyMedium),
              ]),
              const SizedBox(height: 4.0),
              AppListCard(card: true, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.id, style: Theme.of(context).textTheme.labelSmall)),
              const SizedBox(height: 4.0),
              Text('Split breakdown', style: Theme.of(context).textTheme.titleSmall),
              const SizedBox(height: AppSpacing.xs),
              BlocBuilder<ExpenseClaimSplitListCubit, ExpenseClaimSplitListState>(
                builder: (context, splitState) {
                  final lines = splitState.expenseClaimSplits.where((e) => e.expenseClaimId == id).toList();
                  if (lines.isEmpty) {
                    return const Text('No split configured', style: TextStyle(color: AppColors.textSecondary));
                  }
                  return Column(
                    crossAxisAlignment: CrossAxisAlignment.stretch,
                    children: [
                      for (final l in lines)
                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
                          Text(l.category),
                          Text('${l.percent.toStringAsFixed(1)}%'),
                        ]),
                    ],
                  );
                },
              ),
              ],
            );
        },
        ),
      ),
    );
  }
}
