// [generated] generator=ScreenGenerator template=screen_detail_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/state/expense_claim_list.dart';



import 'package:rasheed_replica_ledgerly/core/app_strings.dart';

class ExpenseClaimDetailScreen extends StatelessWidget {
  const ExpenseClaimDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('Expense Claim details'),
      actions: [
        IconButton(tooltip: AppStrings.of(context).edit, icon: const Icon(Icons.edit), onPressed: () => context.push('/expense-claim/${id}/edit')),
        IconButton(tooltip: AppStrings.of(context).delete, icon: const Icon(Icons.delete), onPressed: () async { await context.read<ExpenseClaimListCubit>().delete(id!); if (context.mounted) context.go('/expense-claim'); }),
      ]),
      body: BlocBuilder<ExpenseClaimListCubit, ExpenseClaimListState>(
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
              AppListCard(card: true, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.id, style: Theme.of(context).textTheme.labelSmall)),
              ],
            );
        },
      ),
    );
  }
}
