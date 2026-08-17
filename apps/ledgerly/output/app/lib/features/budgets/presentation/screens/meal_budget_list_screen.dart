// [generated] generator=ScreenGenerator template=screen_list_bloc_search_scroll.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/presentation/state/meal_budget_list.dart';


import 'package:rasheed_replica_ledgerly/core/budget.dart';
import 'package:rasheed_replica_ledgerly/core/app_strings.dart';

class MealBudgetListScreen extends StatefulWidget {
  const MealBudgetListScreen({super.key});

  @override
  State<MealBudgetListScreen> createState() => _MealBudgetListScreenState();
}

class _MealBudgetListScreenState extends State<MealBudgetListScreen> {
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
      appBar: AppBar(title: const Text('Meal Budgets'), backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null),
      body: NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: BlocBuilder<MealBudgetListCubit, MealBudgetListState>(
        builder: (context, state) {
        if (state.status == MealBudgetListStatus.loading) return const LoadingState();
        if (state.status == MealBudgetListStatus.failure) return ErrorState(message: state.errorMessage, onRetry: () => context.read<MealBudgetListCubit>().load());
    final items = state.mealBudgets;
            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? items : items.where((item) => (item.name).toLowerCase().contains(query)).toList();
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, 0),
                  child: SearchBar(
                    controller: _searchController,
                    hintText: 'Search Meal Budgets',
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
                      ? EmptyState(message: 'No Meal Budgets yet',
                        action: OutlinedButton(onPressed: () => context.push('/meal-budget/new'), child: Text('${AppStrings.of(context).newLabel} MealBudget')))
                      : filtered.isEmpty && query.isNotEmpty
                      ? EmptyState(message: 'No results for "$_query"')
                      : RefreshIndicator(
                    onRefresh: () => context.read<MealBudgetListCubit>().load(),
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
                ),
              ],
            );
        },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        tooltip: '${AppStrings.of(context).newLabel} MealBudget',
        onPressed: () => context.push('/meal-budget/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}
