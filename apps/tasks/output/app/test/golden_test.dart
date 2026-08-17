// [generated] generator=GoldenTestGenerator template=golden_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:get_it/get_it.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:rasheed_replica_tasks/core/di.dart';import 'package:rasheed_replica_tasks/generated.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:flutter/material.dart';

void main() {
  setUpAll(() async {
    final font = FontLoader('Roboto');
    for (final f in const ['Roboto-Regular', 'Roboto-Medium', 'Roboto-Bold']) {
      font.addFont(rootBundle.load('assets/fonts/$f.ttf'));
    }
    await font.load();
    final icons = FontLoader('MaterialIcons')
      ..addFont(rootBundle.load('assets/fonts/MaterialIcons-Regular.otf'));
    await icons.load();
  });

  setUp(() => GetIt.instance.reset());

  testWidgets('TaskListScreen renders (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<TaskListCubit>(
      create: (_) => sl<TaskListCubit>()..load(),
      child: MaterialApp(theme: buildTheme(), home: TaskListScreen()),
    ));
    await tester.pumpAndSettle();
    await expectLater(find.byType(TaskListScreen), matchesGoldenFile('goldens/task_list_screen.png'));
  });


  testWidgets('TaskListScreen renders empty with CTA (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<TaskListCubit>(
      create: (_) => sl<TaskListCubit>(),
      child: MaterialApp(theme: buildTheme(), home: TaskListScreen()),
    ));
    await tester.pumpAndSettle();
    await expectLater(find.byType(TaskListScreen), matchesGoldenFile('goldens/task_list_screen_empty.png'));
  });
}
