// [generated] generator=WizardGamifiedTestGenerator template=wizard_gamified_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_choice_demo/main.dart';
import 'package:rasheed_replica_choice_demo/core/router.dart';
import 'package:rasheed_replica_choice_demo/core/di.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('PickWizardScreen: a perfect run shows the full score, star count, and every rule\'s mark on the result step', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/pick/wizard');
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'b'));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();


    expect(find.textContaining('(1/1)'), findsOneWidget, reason: 'a perfect run must show every gamified rule fired');
    expect(find.text('1 correct × 5 ⭐ = 5 ⭐'), findsOneWidget, reason: 'the result score must show its own arithmetic, not a bare number');
    expect(find.text('Correct! +5 stars'), findsNWidgets(1), reason: 'every rule sharing this exact message must each show their own fired mark');
  });

  testWidgets('PickWizardScreen: a wrong pick shows the correct answer and a running score live, on the step itself', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/pick/wizard');
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(ChoiceChip, 'a'));
    await tester.pumpAndSettle();
    expect(find.text('Not quite — the answer was b'), findsOneWidget, reason: 'a wrong pick must reveal the correct answer immediately, on the step itself');
    expect(find.textContaining('0 correct'), findsOneWidget, reason: 'the running score must reflect zero correct so far right after the wrong pick');
    await tester.tap(find.text('Next').hitTestable());
    await tester.pumpAndSettle();


    expect(find.text('0 correct × 5 ⭐ = 0 ⭐'), findsOneWidget, reason: 'a partial run must still show its own correct arithmetic on the result page');
  });
}
