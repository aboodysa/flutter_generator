// [generated] generator=ViewportSqueezeTestGenerator template=viewport_squeeze.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_kids_quiz/main.dart';
import 'package:rasheed_replica_kids_quiz/core/router.dart';
import 'package:rasheed_replica_kids_quiz/core/di.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('QuestionListScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/question');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'QuestionListScreen must not overflow at 320x480');
  });

  testWidgets('QuestionListScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/question');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'QuestionListScreen must not overflow at 390x844');
  });

  testWidgets('QuestionListScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/question');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'QuestionListScreen must not overflow at 1400x900');
  });

  testWidgets('AchievementListScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/achievement');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'AchievementListScreen must not overflow at 320x480');
  });

  testWidgets('AchievementListScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/achievement');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'AchievementListScreen must not overflow at 390x844');
  });

  testWidgets('AchievementListScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/achievement');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'AchievementListScreen must not overflow at 1400x900');
  });

  testWidgets('QuizRunListScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'QuizRunListScreen must not overflow at 320x480');
  });

  testWidgets('QuizRunListScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'QuizRunListScreen must not overflow at 390x844');
  });

  testWidgets('QuizRunListScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'QuizRunListScreen must not overflow at 1400x900');
  });

  testWidgets('QuizRunWizardScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/wizard');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'QuizRunWizardScreen must not overflow at 320x480');
  });

  testWidgets('QuizRunWizardScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/wizard');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'QuizRunWizardScreen must not overflow at 390x844');
  });

  testWidgets('QuizRunWizardScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/wizard');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'QuizRunWizardScreen must not overflow at 1400x900');
  });
}
