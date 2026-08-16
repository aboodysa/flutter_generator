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
  final _nameFocus = FocusNode();



  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _name.text = i?.name ?? '';
    _amount.text = i?.amount == null ? '' : (i!.amount.minorUnits / 100).toStringAsFixed(2);
    if (i != null) _status = i.status;

  }

  @override
  void dispose() {
    _name.dispose();
    _amount.dispose();
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
        TextField(controller: _amount, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Amount', suffixText: 'SAR')),
        Wrap(spacing: AppSpacing.sm, children: ClaimStatus.values.map((v) => ChoiceChip(label: Text(v.name), selected: _status == v, selectedColor: AppChip.colorForTone(context, AppChip.toneForStatus(v.name)).withValues(alpha: 0.2), onSelected: (_) => setState(() => _status = v))).toList()),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? AppStrings.of(context).create : AppStrings.of(context).save,
            onPressed: () async {
              final item = ExpenseClaim(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        name: _name.text,
        amount: Money(minorUnits: ((double.tryParse(_amount.text) ?? 0.0) * 100).round(), currency: 'SAR'),
        status: _status,
              );
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('/expense-claim/${item.id}');
            },
          ),
        ],
      ),
    );
  }
}
