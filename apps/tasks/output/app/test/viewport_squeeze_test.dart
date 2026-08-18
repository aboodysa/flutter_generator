// [generated] generator=ViewportSqueezeTestGenerator template=viewport_squeeze.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_tasks/main.dart';
import 'package:rasheed_replica_tasks/core/router.dart';
import 'package:rasheed_replica_tasks/core/di.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('TaskListScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'TaskListScreen must not overflow at 320x480');
  });

  testWidgets('TaskListScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'TaskListScreen must not overflow at 390x844');
  });

  testWidgets('TaskListScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'TaskListScreen must not overflow at 1400x900');
  });

  testWidgets('TaskDetailScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'TaskDetailScreen must not overflow at 320x480');
  });

  testWidgets('TaskDetailScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'TaskDetailScreen must not overflow at 390x844');
  });

  testWidgets('TaskDetailScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'TaskDetailScreen must not overflow at 1400x900');
  });

  testWidgets('FollowUpListScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'FollowUpListScreen must not overflow at 320x480');
  });

  testWidgets('FollowUpListScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'FollowUpListScreen must not overflow at 390x844');
  });

  testWidgets('FollowUpListScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'FollowUpListScreen must not overflow at 1400x900');
  });

  testWidgets('FollowUpDetailScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'FollowUpDetailScreen must not overflow at 320x480');
  });

  testWidgets('FollowUpDetailScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'FollowUpDetailScreen must not overflow at 390x844');
  });

  testWidgets('FollowUpDetailScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'FollowUpDetailScreen must not overflow at 1400x900');
  });
}
