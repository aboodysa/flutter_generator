// [generated] generator=ScreenGenerator template=screen_list.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_expense_tracker/features/expense_tracker/presentation/state/transaction_list.dart';

class TransactionListScreen extends StatelessWidget {
  const TransactionListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('TransactionListScreen')),
      body: BlocBuilder<TransactionListCubit, TransactionListState>(
        builder: (context, state) {
          if (state.status == TransactionListStatus.loading) return const Center(child: CircularProgressIndicator());
            return ListView.builder(
              itemCount: state.transactions.length,
              itemBuilder: (_, i) => ListTile(title: Text(state.transactions[i].toString())),
            );
        },
      ),
    );
  }
}
