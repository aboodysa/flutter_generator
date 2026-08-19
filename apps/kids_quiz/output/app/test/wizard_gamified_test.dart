// [generated] generator=WizardGamifiedTestGenerator template=wizard_gamified_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_kids_quiz/main.dart';
import 'package:rasheed_replica_kids_quiz/core/router.dart';
import 'package:rasheed_replica_kids_quiz/core/di.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('QuizRunWizardScreen: a perfect run shows the full score, star count, and every rule\'s mark on the result step', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/wizard');
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).first, 'Test');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'b'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'a'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'b'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();

    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();


    expect(find.textContaining('(3/3)'), findsOneWidget, reason: 'a perfect run must show every gamified rule fired');
    expect(find.text('3 correct × 5 ⭐ = 15 ⭐'), findsOneWidget, reason: 'the result score must show its own arithmetic, not a bare number');
    expect(find.text('Correct! +5 ⭐'), findsNWidgets(3), reason: 'every rule sharing this exact message must each show their own fired mark');
  });

  testWidgets('QuizRunWizardScreen: a wrong pick shows the correct answer and a running score live, on the step itself', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/wizard');
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextFormField).first, 'Test');
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'a'));
    await tester.pumpAndSettle();
    expect(find.text('Not quite — the answer was b'), findsOneWidget, reason: 'a wrong pick must reveal the correct answer immediately, on the step itself');
    expect(find.textContaining('0 correct'), findsOneWidget, reason: 'the running score must reflect zero correct so far right after the wrong pick');
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'a'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'b'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();


    expect(find.text('2 correct × 5 ⭐ = 10 ⭐'), findsOneWidget, reason: 'a partial run must still show its own correct arithmetic on the result page');
  });
}
