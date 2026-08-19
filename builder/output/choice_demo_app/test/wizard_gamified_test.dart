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
    for (final message in ['Correct! +5 stars']) {
      expect(find.text(message), findsOneWidget, reason: 'each fired rule\'s own message must be shown as a success-tone mark');
    }
  });
}
