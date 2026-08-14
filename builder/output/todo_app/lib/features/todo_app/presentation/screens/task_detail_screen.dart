// [generated] generator=ScreenGenerator template=screen_detail.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_todo_app/features/todo_app/presentation/state/task_list.dart';

class TaskDetailScreen extends StatelessWidget {
  const TaskDetailScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('TaskDetailScreen')),
      body: BlocBuilder<TaskListCubit, TaskListState>(
        builder: (context, state) {
          if (state.status == TaskListStatus.loading) return const Center(child: CircularProgressIndicator());
            return Center(child: Text(state.toString()));
        },
      ),
    );
  }
}
