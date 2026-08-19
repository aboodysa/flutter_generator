// [generated] generator=PolicyTestGenerator template=policy_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_kids_quiz/main.dart';
import 'package:rasheed_replica_kids_quiz/core/router.dart';
import 'package:rasheed_replica_kids_quiz/core/components.dart';
import 'package:rasheed_replica_kids_quiz/core/di.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('QuizRun: Question1Correct (warn) shows a message but allows Save', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/new');
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: find.byType(Wrap).at(0), matching: find.widgetWithText(ChoiceChip, 'b')));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('Correct! +5 ⭐'), findsAtLeastNWidgets(1));
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a warn verdict must never block Save');
  });

  testWidgets('QuizRun: Question2Correct (warn) shows a message but allows Save', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/new');
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: find.byType(Wrap).at(1), matching: find.widgetWithText(ChoiceChip, 'a')));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('Correct! +5 ⭐'), findsAtLeastNWidgets(1));
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a warn verdict must never block Save');
  });

  testWidgets('QuizRun: Question3Correct (warn) shows a message but allows Save', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/new');
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: find.byType(Wrap).at(2), matching: find.widgetWithText(ChoiceChip, 'b')));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('Correct! +5 ⭐'), findsAtLeastNWidgets(1));
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a warn verdict must never block Save');
  });

  testWidgets('QuizRun: RunCompleted (warn) shows a message but allows Save', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/new');
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'completed'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('Great job finishing the quiz! +5 ⭐'), findsOneWidget);
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a warn verdict must never block Save');
  });
}
