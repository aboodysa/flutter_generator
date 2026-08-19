// [generated] generator=WizardFocusTestGenerator template=wizard_focus_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_kids_quiz/main.dart';
import 'package:rasheed_replica_kids_quiz/core/router.dart';
import 'package:rasheed_replica_kids_quiz/core/di.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('QuizRunWizardScreen: first step wires a focus-bypass FocusNode on every text-input field', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/quiz-run/wizard');
    await tester.pumpAndSettle();
    expect(find.byType(TextFormField), findsNWidgets(1), reason: 'the wizard first step must render exactly its own text-input widgets');
    final fields = tester.widgetList<TextField>(find.byType(TextField)).toList();
    final bypassFields = fields.where((f) => f.focusNode != null).toList();
    expect(bypassFields.length, 1, reason: 'every text-input field (String/int/double/Money) needs its own FocusNode bypass, and DateTime must stay readOnly with none');
    for (final f in bypassFields) {
      expect(f.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside that field\'s own tap gesture');
    }
    await tester.tap(find.byType(TextField).at(0));
    await tester.pump();
    expect(fields[0].focusNode!.hasFocus, isTrue, reason: 'tapping wizard text-input field 0 must actually transition it to focused');
  });
}
