// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/core/theme.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/state/expense_claim_list.dart';
import 'package:rasheed_replica_ledgerly/core/app_strings.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/claim_status.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim.dart';
import 'package:rasheed_replica_ledgerly/core/money.dart';
import 'package:rasheed_replica_ledgerly/core/policy.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/policy/expense_claim_policy.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/presentation/state/expense_claim_split_list.dart';
import 'package:rasheed_replica_ledgerly/features/expenses/domain/entities/expense_claim_split.dart';
import 'package:rasheed_replica_ledgerly/core/split.dart';

class ExpenseClaimFormScreen extends StatelessWidget {
  const ExpenseClaimFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New ExpenseClaim' : 'Edit ExpenseClaim')),
      body: BlocBuilder<ExpenseClaimListCubit, ExpenseClaimListState>(
        builder: (context, state) {
          final matches = state.expenseClaims.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _ExpenseClaimFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<ExpenseClaimListCubit>().create(item)
                : context.read<ExpenseClaimListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _ExpenseClaimFormScreenBody extends StatefulWidget {
  const _ExpenseClaimFormScreenBody({super.key, required this.initial, required this.id, required this.onSubmit});
  final ExpenseClaim? initial;
  final String? id;
  final Future<void> Function(ExpenseClaim) onSubmit;

  @override
  State<_ExpenseClaimFormScreenBody> createState() => _ExpenseClaimFormScreenBodyState();
}

class _ExpenseClaimFormScreenBodyState extends State<_ExpenseClaimFormScreenBody> {
  final _name = TextEditingController();
  final _amount = TextEditingController();
  ClaimStatus _status = ClaimStatus.values.first;
  bool _exported = false;
  final _nameFocus = FocusNode();
  final _amountFocus = FocusNode();
  final Map<String, TextEditingController> _waiveReasonControllers = {};
  final Map<String, PolicyVerdict> _waivedVerdicts = {};
  final _policyJustification = TextEditingController();
  final List<SplitRowControllers> _splitRows = [];

  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _name.text = i?.name ?? '';
    _amount.text = i?.amount == null ? '' : (i!.amount.minorUnits / 100).toStringAsFixed(2);
    if (i != null) _status = i.status;
    if (i != null) _exported = i.exported;
    if (widget.id != null) {
      for (final s in context.read<ExpenseClaimSplitListCubit>().state.expenseClaimSplits.where((s) => s.expenseClaimId == widget.id)) {
        _splitRows.add(SplitRowControllers(category: s.category, percent: s.percent.toString()));
      }
    }
  }

  @override
  void dispose() {
    _name.dispose();
    _amount.dispose();
    _nameFocus.dispose();
    _amountFocus.dispose();
    for (final c in _waiveReasonControllers.values) {
      c.dispose();
    }
    _policyJustification.dispose();
    for (final r in _splitRows) {
      r.dispose();
    }
    super.dispose();
  }

  TextEditingController _waiveController(String ruleId) =>
      _waiveReasonControllers.putIfAbsent(ruleId, () => TextEditingController());

  ExpenseClaim _draft() => ExpenseClaim(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: _name.text,
        amount: Money(minorUnits: ((double.tryParse(_amount.text) ?? 0.0) * 100).round(), currency: 'SAR'),
        status: _status,
        exported: _exported,
      );

  List<PolicyVerdict> _verdicts() => evaluateExpenseClaimPolicy(_draft())
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

  void _addSplitRow() => setState(() => _splitRows.add(SplitRowControllers()));

  void _removeSplitRow(int i) => setState(() {
        _splitRows[i].dispose();
        _splitRows.removeAt(i);
      });

  List<SplitLine> _splitLines() => _splitRows
      .map((r) => SplitLine(category: r.category.text, percent: double.tryParse(r.percent.text) ?? 0))
      .toList();

  double get _splitTotal => _splitLines().fold<double>(0, (s, l) => s + l.percent);

  Widget _splitSection() {
    final errors = validateSplit(_splitLines());
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Split', style: Theme.of(context).textTheme.titleMedium),
        for (var i = 0; i < _splitRows.length; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _splitRows[i].category,
                    decoration: const InputDecoration(labelText: 'Category'),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                SizedBox(
                  width: 96,
                  child: TextField(
                    controller: _splitRows[i].percent,
                    decoration: const InputDecoration(labelText: '%'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () => _removeSplitRow(i)),
              ],
            ),
          ),
        TextButton.icon(onPressed: _addSplitRow, icon: const Icon(Icons.add), label: const Text('Add split')),
        Text(
          'Split total: ${_splitTotal.toStringAsFixed(2)}%',
          style: TextStyle(color: errors.isEmpty ? null : AppColors.error, fontWeight: FontWeight.bold),
        ),
        for (final e in errors) Text(e, style: const TextStyle(color: AppColors.error)),
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
        TextField(controller: _amount, focusNode: _amountFocus, onTap: () => _amountFocus.requestFocus(), onChanged: (_) => setState(() {}), keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Amount', suffixText: 'SAR')),
        Wrap(spacing: AppSpacing.sm, children: ClaimStatus.values.map((v) => ChoiceChip(label: Text(v.name), selected: _status == v, selectedColor: AppChip.colorForTone(context, AppChip.toneForStatus(v.name)).withValues(alpha: 0.2), onSelected: (_) => setState(() => _status = v))).toList()),
        CheckboxListTile(title: const Text('Exported'), value: _exported, onChanged: (v) => setState(() => _exported = v ?? false)),
          _policyPanel(),
          _splitSection(),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? AppStrings.of(context).create : AppStrings.of(context).save,
            onPressed: _verdicts().any((v) => v.blocksAdvance || (v.requiresJustification && _policyJustification.text.trim().isEmpty))
                ? null
                : validateSplit(_splitLines()).isNotEmpty
                ? null
                : widget.initial?.exported == true
                ? null
                : () async {
              final item = _draft();
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              {
                final existingSplits = context.read<ExpenseClaimSplitListCubit>().state.expenseClaimSplits.where((e) => e.expenseClaimId == item.id).toList();
                for (final e in existingSplits) {
                  await context.read<ExpenseClaimSplitListCubit>().delete(e.id);
                }
                for (var i = 0; i < _splitLines().length; i++) {
                  final line = _splitLines()[i];
                  await context.read<ExpenseClaimSplitListCubit>().create(ExpenseClaimSplit(
                    id: '${item.id}-split-$i',
                    expenseClaimId: item.id,
                    category: line.category,
                    percent: line.percent,
                  ));
                }
              }
              if (context.mounted) context.pushReplacement('/expense-claim/${item.id}');
            },
          ),
        ],
      ),
    );
  }
}
