// [generated] generator=PolicyTestGenerator template=policy_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_choice_demo/main.dart';
import 'package:rasheed_replica_choice_demo/core/router.dart';
import 'package:rasheed_replica_choice_demo/core/components.dart';
import 'package:rasheed_replica_choice_demo/core/di.dart';
import 'package:rasheed_replica_choice_demo/generated.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('Pick: MoodHappy (warn) shows a message but allows Save', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/pick/new');
    await tester.pumpAndSettle();
    await tester.tap(find.byType(DropdownButton<MoodOption>));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(DropdownMenuItem<MoodOption>, 'happy').last, warnIfMissed: false);
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.textContaining('Feeling happy today!'), findsOneWidget);
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a warn verdict must never block Save');
  });
}
