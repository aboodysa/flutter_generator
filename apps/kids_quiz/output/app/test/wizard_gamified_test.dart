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
    expect(find.text('Correct! +5 ⭐'), findsNWidgets(3), reason: 'every rule sharing this exact message must each show their own fired mark');
  });
}
