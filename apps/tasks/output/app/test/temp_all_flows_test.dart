// TEMP harness — all flows (not committed; source of apps/<app>/output/goldens/)
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:rasheed_replica_tasks/main.dart';
import 'package:rasheed_replica_tasks/core/di.dart';
import 'package:rasheed_replica_tasks/core/router.dart';
import 'package:rasheed_replica_tasks/generated.dart';
import 'package:rasheed_replica_tasks/core/theme.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/screens/task_form_screen.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/screens/follow_up_form_screen.dart';

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

  testWidgets('TaskListScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task');
    await tester.pumpAndSettle();
    await expectLater(find.byType(TaskListScreen), matchesGoldenFile('goldens/TaskListScreen_all.png'));
  });

  testWidgets('TaskDetailScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task/x');
    await tester.pumpAndSettle();
    await expectLater(find.byType(TaskDetailScreen), matchesGoldenFile('goldens/TaskDetailScreen_all.png'));
  });

  testWidgets('TaskFormScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task/new');
    await tester.pumpAndSettle();
    await expectLater(find.byType(TaskFormScreen), matchesGoldenFile('goldens/TaskFormScreen_all.png'));
  });

  testWidgets('FollowUpListScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up');
    await tester.pumpAndSettle();
    await expectLater(find.byType(FollowUpListScreen), matchesGoldenFile('goldens/FollowUpListScreen_all.png'));
  });

  testWidgets('FollowUpDetailScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up/x');
    await tester.pumpAndSettle();
    await expectLater(find.byType(FollowUpDetailScreen), matchesGoldenFile('goldens/FollowUpDetailScreen_all.png'));
  });

  testWidgets('FollowUpFormScreen (golden)', (tester) async {
    setupDependencies();
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up/new');
    await tester.pumpAndSettle();
    await expectLater(find.byType(FollowUpFormScreen), matchesGoldenFile('goldens/FollowUpFormScreen_all.png'));
  });
}
