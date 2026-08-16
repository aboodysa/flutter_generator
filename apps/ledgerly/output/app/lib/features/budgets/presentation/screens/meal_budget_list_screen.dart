// [generated] generator=ScreenGenerator template=screen_list_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/presentation/state/meal_budget_list.dart';


import 'package:rasheed_replica_ledgerly/core/budget.dart';

class MealBudgetListScreen extends StatelessWidget {
  const MealBudgetListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Meal Budgets')),
      body: BlocBuilder<MealBudgetListCubit, MealBudgetListState>(
        builder: (context, state) {
        if (state.status == MealBudgetListStatus.loading) return const LoadingState();
        if (state.status == MealBudgetListStatus.failure) return ErrorState(message: state.errorMessage);
    final items = state.mealBudgets;
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
                          final budget = BudgetLine(scope: item.name, limit: item.limit, committed: item.committed, actual: item.actual);
                          return Padding(
                            padding: const EdgeInsets.only(bottom: 8.0),
                            child: AppListCard(
                              key: ValueKey(item.id),
                              card: true,
                              leading: AppAvatar(label: item.name),
                              title: Text(item.name),
                              subtitle: Text('used ${(budget.pctUsed * 100).round()}% · ${budget.remaining.format()} left'),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () => context.push('/meal-budget/${item.id}'),
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
        tooltip: 'New MealBudget',
        onPressed: () => context.push('/meal-budget/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
