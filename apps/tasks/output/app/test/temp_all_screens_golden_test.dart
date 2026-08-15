// TEMP golden harness — all screens (not committed; source of apps/tasks/output/goldens/)
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:rasheed_replica_tasks/main.dart';
import 'package:rasheed_replica_tasks/core/di.dart';
import 'package:rasheed_replica_tasks/core/router.dart';
import 'package:rasheed_replica_tasks/core/components.dart';
import 'package:rasheed_replica_tasks/generated.dart';
import 'package:rasheed_replica_tasks/features/tasks/presentation/screens/task_form_screen.dart';

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
    setupDependencies();
  });

  Future<void> pumpApp(WidgetTester tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    appRouter.go('/task');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
  }

  testWidgets('TaskDetailScreen (golden)', (tester) async {
    await pumpApp(tester);
    await tester.tap(find.byType(AppListCard).first);
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await expectLater(find.byType(TaskDetailScreen), matchesGoldenFile('goldens/task_detail_screen.png'));
  });

  testWidgets('TaskFormScreen (golden)', (tester) async {
    await pumpApp(tester);
    await tester.tap(find.byType(FloatingActionButton));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await expectLater(find.byType(TaskFormScreen), matchesGoldenFile('goldens/task_form_screen.png'));
  });

  testWidgets('FollowUpListScreen (golden)', (tester) async {
    await pumpApp(tester);
    await tester.tap(find.byType(AppListCard).first);
    await tester.pumpAndSettle();
    await tester.tap(find.text('View FollowUps'));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull);
    await expectLater(find.byType(FollowUpListScreen), matchesGoldenFile('goldens/follow_up_list_screen.png'));
  });
}
