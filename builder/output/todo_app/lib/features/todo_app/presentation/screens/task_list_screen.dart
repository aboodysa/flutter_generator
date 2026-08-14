// [generated] generator=ScreenGenerator template=screen_list.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/presentation/state/task_list.dart';

class TaskListScreen extends StatelessWidget {
  const TaskListScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('TaskListScreen')),
      body: BlocBuilder<TaskListCubit, TaskListState>(
        builder: (context, state) {
          if (state.status == TaskListStatus.loading) return const Center(child: CircularProgressIndicator());
            return ListView.builder(
              itemCount: state.transactions.length,
              itemBuilder: (_, i) => ListTile(title: Text(state.transactions[i].toString())),
            );
        },
      ),
    );
  }
}
