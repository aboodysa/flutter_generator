// [generated] generator=GoldenTestGenerator template=golden.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_todo_app/generated.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('TaskListScreen renders (golden)', (tester) async {
    await tester.pumpWidget(BlocProvider<TaskListCubit>(
      create: (_) => TaskListCubit(),
      child: const MaterialApp(home: TaskListScreen()),
    ));
    await expectLater(find.byType(TaskListScreen), matchesGoldenFile('goldens/task_list_screen.png'));
  });
}
