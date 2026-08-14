// [generated] generator=ProjectGenerator template=main.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'generated.dart';

void main() => runApp(const ReplicaApp());

class ReplicaApp extends StatelessWidget {
  const ReplicaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Generated app',
      theme: ThemeData(colorSchemeSeed: Colors.teal),
      home: BlocProvider<TransactionListCubit>(
        create: (_) => TransactionListCubit()..load(),
        child: const TransactionListScreen(),
      ),
    );
  }
}
