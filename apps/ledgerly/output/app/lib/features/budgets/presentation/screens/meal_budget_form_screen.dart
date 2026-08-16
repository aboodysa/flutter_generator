// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/presentation/state/meal_budget_list.dart';
import 'package:rasheed_replica_ledgerly/core/app_strings.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/entities/meal_budget.dart';
import 'package:rasheed_replica_ledgerly/core/money.dart';



class MealBudgetFormScreen extends StatelessWidget {
  const MealBudgetFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New MealBudget' : 'Edit MealBudget')),
      body: BlocBuilder<MealBudgetListCubit, MealBudgetListState>(
        builder: (context, state) {
          final matches = state.mealBudgets.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _MealBudgetFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<MealBudgetListCubit>().create(item)
                : context.read<MealBudgetListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _MealBudgetFormScreenBody extends StatefulWidget {
  const _MealBudgetFormScreenBody({super.key, required this.initial, required this.id, required this.onSubmit});
  final MealBudget? initial;
  final String? id;
  final Future<void> Function(MealBudget) onSubmit;

  @override
  State<_MealBudgetFormScreenBody> createState() => _MealBudgetFormScreenBodyState();
}

class _MealBudgetFormScreenBodyState extends State<_MealBudgetFormScreenBody> {
  final _name = TextEditingController();
  final _limit = TextEditingController();
  final _committed = TextEditingController();
  final _actual = TextEditingController();

  final _nameFocus = FocusNode();



  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _name.text = i?.name ?? '';
    _limit.text = i?.limit == null ? '' : (i!.limit.minorUnits / 100).toStringAsFixed(2);
    _committed.text = i?.committed == null ? '' : (i!.committed.minorUnits / 100).toStringAsFixed(2);
    _actual.text = i?.actual == null ? '' : (i!.actual.minorUnits / 100).toStringAsFixed(2);

  }

  @override
  void dispose() {
    _name.dispose();
    _limit.dispose();
    _committed.dispose();
    _actual.dispose();
    _nameFocus.dispose();


    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
        TextField(controller: _name, focusNode: _nameFocus, onTap: () => _nameFocus.requestFocus(), decoration: const InputDecoration(labelText: 'Name')),
        TextField(controller: _limit, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Limit', suffixText: 'SAR')),
        TextField(controller: _committed, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Committed', suffixText: 'SAR')),
        TextField(controller: _actual, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Actual', suffixText: 'SAR')),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? AppStrings.of(context).create : AppStrings.of(context).save,
            onPressed: () async {
              final item = MealBudget(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: _name.text,
        limit: Money(minorUnits: ((double.tryParse(_limit.text) ?? 0.0) * 100).round(), currency: 'SAR'),
        committed: Money(minorUnits: ((double.tryParse(_committed.text) ?? 0.0) * 100).round(), currency: 'SAR'),
        actual: Money(minorUnits: ((double.tryParse(_actual.text) ?? 0.0) * 100).round(), currency: 'SAR'),
              );
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('/meal-budget/${item.id}');
            },
          ),
        ],
      ),
    );
  }
}
