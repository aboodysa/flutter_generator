// [generated] generator=FocusTestGenerator template=focus_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_tasks/main.dart';
import 'package:rasheed_replica_tasks/core/router.dart';
import 'package:rasheed_replica_tasks/core/di.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('Task: create form wires a focus-bypass FocusNode on its first field', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task/new');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.focusNode, isNotNull, reason: 'first field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(field.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(field.focusNode!.hasFocus, isTrue, reason: 'tapping the field must actually transition it to focused');
  });

  testWidgets('Task: edit form wires a focus-bypass FocusNode on its first field', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task/x/edit');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.focusNode, isNotNull, reason: 'first field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(field.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(field.focusNode!.hasFocus, isTrue, reason: 'tapping the field must actually transition it to focused');
  });

  testWidgets('FollowUp: create form wires a focus-bypass FocusNode on its first field', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up/new');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.focusNode, isNotNull, reason: 'first field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(field.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(field.focusNode!.hasFocus, isTrue, reason: 'tapping the field must actually transition it to focused');
  });

  testWidgets('FollowUp: edit form wires a focus-bypass FocusNode on its first field', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up/x/edit');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.focusNode, isNotNull, reason: 'first field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(field.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(field.focusNode!.hasFocus, isTrue, reason: 'tapping the field must actually transition it to focused');
  });
}
