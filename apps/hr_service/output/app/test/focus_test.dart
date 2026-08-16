// [generated] generator=FocusTestGenerator template=focus_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_hr_service/main.dart';
import 'package:rasheed_replica_hr_service/core/router.dart';
import 'package:rasheed_replica_hr_service/core/di.dart';

import 'package:rasheed_replica_hr_service/core/session.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('LeaveRequest: create form wires a focus-bypass FocusNode on its first field', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/leave-request/new');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.focusNode, isNotNull, reason: 'first field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(field.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(field.focusNode!.hasFocus, isTrue, reason: 'tapping the field must actually transition it to focused');
  });

  testWidgets('LeaveRequest: edit form wires a focus-bypass FocusNode on its first field', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/leave-request/x/edit');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.focusNode, isNotNull, reason: 'first field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(field.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(field.focusNode!.hasFocus, isTrue, reason: 'tapping the field must actually transition it to focused');
  });

  testWidgets('Approval: create form wires a focus-bypass FocusNode on its first field', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/approval/new');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.focusNode, isNotNull, reason: 'first field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(field.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(field.focusNode!.hasFocus, isTrue, reason: 'tapping the field must actually transition it to focused');
  });

  testWidgets('Approval: edit form wires a focus-bypass FocusNode on its first field', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/approval/x/edit');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.focusNode, isNotNull, reason: 'first field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(field.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(field.focusNode!.hasFocus, isTrue, reason: 'tapping the field must actually transition it to focused');
  });
}
