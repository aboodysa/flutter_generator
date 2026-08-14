// [generated] generator=FormGenerator template=form.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:rasheed_replica_expense_tracker/core/validator.dart';
import 'package:rasheed_replica_expense_tracker/core/components.dart';

class TransactionForm extends StatefulWidget {
  const TransactionForm({super.key});
  @override
  State<TransactionForm> createState() => _TransactionFormState();
}

class _TransactionFormState extends State<TransactionForm> {
  final _merchant = TextEditingController();
  final _amount = TextEditingController();
  final _email = TextEditingController();

  String? get merchantError => Validators.required(_merchant.text) ?? null;
  String? get amountError => Validators.required(_amount.text) ?? (double.tryParse(_amount.text) == null ? 'invalid number' : null);
  String? get emailError => Validators.email(_email.text);

  @override
  void dispose() {
    _merchant.dispose();
    _amount.dispose();
    _email.dispose();
    super.dispose();
  }

  bool get isValid => [merchantError, amountError, emailError].every((e) => e == null);

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        TextField(
          controller: _merchant,
          keyboardType: TextInputType.text,
          decoration: InputDecoration(labelText: 'merchant', errorText: merchantError),
        ),
        TextField(
          controller: _amount,
          keyboardType: TextInputType.number,
          decoration: InputDecoration(labelText: 'amount', errorText: amountError),
        ),
        TextField(
          controller: _email,
          keyboardType: TextInputType.emailAddress,
          decoration: InputDecoration(labelText: 'email', errorText: emailError),
        ),
        const SizedBox(height: 16),
        PrimaryButton(label: 'Submit', onPressed: isValid ? () {} : null),
      ],
    );
  }
}
