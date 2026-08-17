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
import 'package:rasheed_replica_ledgerly/core/policy.dart';
import 'package:rasheed_replica_ledgerly/features/budgets/domain/policy/meal_budget_policy.dart';


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
  final Map<String, TextEditingController> _waiveReasonControllers = {};
  final Map<String, PolicyVerdict> _waivedVerdicts = {};
  final _policyJustification = TextEditingController();


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
    for (final c in _waiveReasonControllers.values) {
      c.dispose();
    }
    _policyJustification.dispose();

    super.dispose();
  }

  TextEditingController _waiveController(String ruleId) =>
      _waiveReasonControllers.putIfAbsent(ruleId, () => TextEditingController());

  MealBudget _draft() => MealBudget(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: _name.text,
        limit: Money(minorUnits: ((double.tryParse(_limit.text) ?? 0.0) * 100).round(), currency: 'SAR'),
        committed: Money(minorUnits: ((double.tryParse(_committed.text) ?? 0.0) * 100).round(), currency: 'SAR'),
        actual: Money(minorUnits: ((double.tryParse(_actual.text) ?? 0.0) * 100).round(), currency: 'SAR'),
      );

  List<PolicyVerdict> _verdicts() => evaluateMealBudgetPolicy(_draft())
      .map((v) => _waivedVerdicts[v.ruleId] ?? v)
      .toList();

  Widget _policyPanel() {
    final visible = _verdicts().where((v) => v.severity != PolicySeverity.autoApprove).toList();
    if (visible.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final v in visible)
          Card(
            // M2/component-registry (§8): tone comes from the same AppChip.colorForTone mapping
            // ChoiceChip's selectedColor already uses below — no raw material-Colors literal.
            color: v.isWaived
                ? AppChip.colorForTone(context, AppChipTone.neutral).withValues(alpha: 0.12)
                : v.severity == PolicySeverity.block
                    ? AppChip.colorForTone(context, AppChipTone.danger).withValues(alpha: 0.08)
                    : v.severity == PolicySeverity.warn
                        ? AppChip.colorForTone(context, AppChipTone.warning).withValues(alpha: 0.08)
                        : AppChip.colorForTone(context, AppChipTone.info).withValues(alpha: 0.08),
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v.isWaived ? '${v.message} (waived)' : v.message),
                  if (v.requiresJustification) ...[
                    const SizedBox(height: AppSpacing.xs),
                    TextField(
                      controller: _policyJustification,
                      decoration: const InputDecoration(labelText: 'Justification'),
                      onChanged: (_) => setState(() {}),
                    ),
                  ],
                  if (!v.isWaived) ...[
                    const SizedBox(height: AppSpacing.xs),
                    TextField(
                      controller: _waiveController(v.ruleId),
                      decoration: const InputDecoration(labelText: 'Waive reason'),
                      onChanged: (_) => setState(() {}),
                    ),
                    TextButton(
                      onPressed: _waiveController(v.ruleId).text.trim().isEmpty
                          ? null
                          : () => setState(() {
                                _waivedVerdicts[v.ruleId] = v.waive(
                                  waivedBy: 'current_user',
                                  waivedReason: _waiveController(v.ruleId).text,
                                );
                              }),
                      child: const Text('Waive'),
                    ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
        TextField(controller: _name, focusNode: _nameFocus, onTap: () => _nameFocus.requestFocus(), decoration: const InputDecoration(labelText: 'Name')),
        TextField(controller: _limit, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Limit', suffixText: 'SAR')),
        TextField(controller: _committed, onChanged: (_) => setState(() {}), keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Committed', suffixText: 'SAR')),
        TextField(controller: _actual, onChanged: (_) => setState(() {}), keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Actual', suffixText: 'SAR')),
          _policyPanel(),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? AppStrings.of(context).create : AppStrings.of(context).save,
            onPressed: _verdicts().any((v) => v.blocksAdvance || (v.requiresJustification && _policyJustification.text.trim().isEmpty))
                ? null
                : () async {
              final item = _draft();
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.pushReplacement('/meal-budget/${item.id}');
            },
          ),
        ],
      ),
    );
  }
}
