// [generated] generator=ProjectGenerator template=main.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'generated/generated.dart';

void main() => runApp(const ReplicaApp());

class ReplicaApp extends StatelessWidget {
  const ReplicaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Rasheed Replica',
      theme: ThemeData(colorSchemeSeed: Colors.teal),
      home: Scaffold(
        appBar: AppBar(title: const Text('Rasheed Replica — generated')),
        body: ListView(
          children: [
            ListTile(title: const Text('Generated entities'), subtitle: Text('TransactionEntity, TransactionItemEntity, TransactionAttachmentEntity, ExpensePaymentEntity, TransactionFeedbackEntity')),
            ListTile(title: const Text('First entity'), subtitle: Text('TransactionEntity')),
        ListTile(title: const Text('Enum PaymentMethod'), subtitle: Text(PaymentMethod.values.map((e) => e.name).join(', '))),
          ],
        ),
      ),
    );
  }
}
