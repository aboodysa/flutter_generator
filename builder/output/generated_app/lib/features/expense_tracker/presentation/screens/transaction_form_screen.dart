// [generated] generator=CrudFormGenerator template=crud_form_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_expense_tracker/core/components.dart';
import 'package:rasheed_replica_expense_tracker/core/theme.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/presentation/state/transaction_list.dart';
import 'package:rasheed_replica_expense_tracker/core/money.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/payment_method.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/domain/entities/transaction.dart';



class TransactionFormScreen extends StatelessWidget {
  const TransactionFormScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New Transaction' : 'Edit Transaction')),
      body: BlocBuilder<TransactionListCubit, TransactionListState>(
        builder: (context, state) {
          final matches = state.transactions.where((e) => e.id == id);
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return _TransactionFormScreenBody(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<TransactionListCubit>().create(item)
                : context.read<TransactionListCubit>().update(item),
          );
        },
      ),
    );
  }
}

class _TransactionFormScreenBody extends StatefulWidget {
  const _TransactionFormScreenBody({super.key, required this.initial, required this.id, required this.onSubmit});
  final Transaction? initial;
  final String? id;
  final Future<void> Function(Transaction) onSubmit;

  @override
  State<_TransactionFormScreenBody> createState() => _TransactionFormScreenBodyState();
}

class _TransactionFormScreenBodyState extends State<_TransactionFormScreenBody> {
  final _amount = TextEditingController();
  final _date = TextEditingController();
  final _merchant = TextEditingController();
  final _note = TextEditingController();
  PaymentMethod _paymentMethod = PaymentMethod.values.first;
  final _amountFocus = FocusNode();



  @override
  void initState() {
    super.initState();
    final i = widget.initial;
    _amount.text = i?.amount == null ? '' : (i!.amount.minorUnits / 100).toStringAsFixed(2);
    _date.text = i?.date == null ? '' : i!.date.toIso8601String().split('T').first;
    _merchant.text = i?.merchant ?? '';
    if (i != null) _paymentMethod = i.paymentMethod;
    _note.text = i?.note ?? '';

  }

  @override
  void dispose() {
    _amount.dispose();
    _date.dispose();
    _merchant.dispose();
    _note.dispose();
    _amountFocus.dispose();


    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
        TextField(controller: _amount, focusNode: _amountFocus, onTap: () => _amountFocus.requestFocus(), keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: 'Amount', suffixText: 'SAR')),
        TextField(controller: _date, readOnly: true, decoration: const InputDecoration(labelText: 'Date', hintText: 'YYYY-MM-DD'), onTap: () async {
          final picked = await showDatePicker(context: context, initialDate: DateTime.tryParse(_date.text) ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
          if (picked != null) setState(() => _date.text = picked.toIso8601String().split('T').first);
        }),
        TextField(controller: _merchant, decoration: const InputDecoration(labelText: 'Merchant')),
        DropdownButton<PaymentMethod>(value: _paymentMethod, items: PaymentMethod.values.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(), onChanged: (v) => setState(() => _paymentMethod = v ?? _paymentMethod)),
        TextField(controller: _note, decoration: const InputDecoration(labelText: 'Note')),
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: () async {
              final item = Transaction(
        id: widget.id ?? DateTime.now().millisecondsSinceEpoch.toString(),
        amount: Money(minorUnits: ((double.tryParse(_amount.text) ?? 0.0) * 100).round(), currency: 'SAR'),
        date: (DateTime.tryParse(_date.text) ?? DateTime.now()),
        merchant: (_merchant.text.isEmpty ? null : _merchant.text),
        paymentMethod: _paymentMethod,
        note: (_note.text.isEmpty ? null : _note.text),
        category: widget.initial?.category,
        items: widget.initial?.items ?? const [],
        attachments: widget.initial?.attachments ?? const [],
              );
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('/transaction');
            },
          ),
        ],
      ),
    );
  }
}
