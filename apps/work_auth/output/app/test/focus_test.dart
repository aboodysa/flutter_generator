// [generated] generator=FocusTestGenerator template=focus_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_work_auth/main.dart';
import 'package:rasheed_replica_work_auth/core/router.dart';
import 'package:rasheed_replica_work_auth/core/di.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('WorkAuth: create form wires a focus-bypass FocusNode on every text-input field', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/work-auth/new');
    await tester.pumpAndSettle();
    final fields = tester.widgetList<TextField>(find.byType(TextField)).toList();
    final bypassFields = fields.where((f) => f.focusNode != null).toList();
    expect(bypassFields.length, 4, reason: 'every text-input field (String/int/double/Money) needs its own FocusNode bypass, and DateTime must stay readOnly with none');
    for (final f in bypassFields) {
      expect(f.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside that field\'s own tap gesture');
    }
    await tester.tap(find.byType(TextField).at(0));
    await tester.pump();
    expect(fields[0].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 0 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(1));
    await tester.pump();
    expect(fields[1].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 1 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(2));
    await tester.pump();
    expect(fields[2].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 2 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(4));
    await tester.pump();
    expect(fields[4].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 4 must actually transition it to focused');
  });

  testWidgets('WorkAuth: edit form wires a focus-bypass FocusNode on every text-input field', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/work-auth/x/edit');
    await tester.pumpAndSettle();
    final fields = tester.widgetList<TextField>(find.byType(TextField)).toList();
    final bypassFields = fields.where((f) => f.focusNode != null).toList();
    expect(bypassFields.length, 4, reason: 'every text-input field (String/int/double/Money) needs its own FocusNode bypass, and DateTime must stay readOnly with none');
    for (final f in bypassFields) {
      expect(f.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside that field\'s own tap gesture');
    }
    await tester.tap(find.byType(TextField).at(0));
    await tester.pump();
    expect(fields[0].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 0 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(1));
    await tester.pump();
    expect(fields[1].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 1 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(2));
    await tester.pump();
    expect(fields[2].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 2 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(4));
    await tester.pump();
    expect(fields[4].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 4 must actually transition it to focused');
  });

  testWidgets('VisaQuota: create form wires a focus-bypass FocusNode on every text-input field', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/visa-quota/new');
    await tester.pumpAndSettle();
    final fields = tester.widgetList<TextField>(find.byType(TextField)).toList();
    final bypassFields = fields.where((f) => f.focusNode != null).toList();
    expect(bypassFields.length, 4, reason: 'every text-input field (String/int/double/Money) needs its own FocusNode bypass, and DateTime must stay readOnly with none');
    for (final f in bypassFields) {
      expect(f.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside that field\'s own tap gesture');
    }
    await tester.tap(find.byType(TextField).at(0));
    await tester.pump();
    expect(fields[0].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 0 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(1));
    await tester.pump();
    expect(fields[1].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 1 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(2));
    await tester.pump();
    expect(fields[2].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 2 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(3));
    await tester.pump();
    expect(fields[3].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 3 must actually transition it to focused');
  });

  testWidgets('VisaQuota: edit form wires a focus-bypass FocusNode on every text-input field', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/visa-quota/x/edit');
    await tester.pumpAndSettle();
    final fields = tester.widgetList<TextField>(find.byType(TextField)).toList();
    final bypassFields = fields.where((f) => f.focusNode != null).toList();
    expect(bypassFields.length, 4, reason: 'every text-input field (String/int/double/Money) needs its own FocusNode bypass, and DateTime must stay readOnly with none');
    for (final f in bypassFields) {
      expect(f.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside that field\'s own tap gesture');
    }
    await tester.tap(find.byType(TextField).at(0));
    await tester.pump();
    expect(fields[0].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 0 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(1));
    await tester.pump();
    expect(fields[1].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 1 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(2));
    await tester.pump();
    expect(fields[2].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 2 must actually transition it to focused');
    await tester.tap(find.byType(TextField).at(3));
    await tester.pump();
    expect(fields[3].focusNode!.hasFocus, isTrue, reason: 'tapping text-input field 3 must actually transition it to focused');
  });
}
