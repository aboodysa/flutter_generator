// [generated] generator=ScreenGenerator template=screen_detail_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/presentation/state/meal_budget_list.dart';


import 'package:rasheed_replica_ledgerly/core/budget.dart';
import 'package:rasheed_replica_ledgerly/core/app_strings.dart';

class MealBudgetDetailScreen extends StatelessWidget {
  const MealBudgetDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: const Text('Meal Budget details'),
      actions: [
        IconButton(tooltip: AppStrings.of(context).edit, icon: const Icon(Icons.edit), onPressed: () => context.push('/meal-budget/${id}/edit')),
        IconButton(tooltip: AppStrings.of(context).delete, icon: const Icon(Icons.delete), onPressed: () async { await context.read<MealBudgetListCubit>().delete(id!); if (context.mounted) context.go('/meal-budget'); }),
      ]),
      body: BlocBuilder<MealBudgetListCubit, MealBudgetListState>(
        builder: (context, state) {
        if (state.status == MealBudgetListStatus.loading) return const LoadingState();
        if (state.status == MealBudgetListStatus.failure) return ErrorState(message: state.errorMessage);
            if (state.mealBudgets.isEmpty) return Center(child: Text(AppStrings.of(context).noData));
            final item = state.mealBudgets.firstWhere((e) => e.id == id, orElse: () => state.mealBudgets.first);
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
