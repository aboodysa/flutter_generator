// [generated] generator=SearchFocusTestGenerator template=search_focus_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_tasks/main.dart';
import 'package:rasheed_replica_tasks/core/router.dart';
import 'package:rasheed_replica_tasks/core/di.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('TaskListScreen: search bar wires a focus-bypass FocusNode (iOS Safari keyboard fix)', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/task');
    await tester.pumpAndSettle();
    final bar = tester.widget<SearchBar>(find.byType(SearchBar));
    expect(bar.focusNode, isNotNull, reason: 'search field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(bar.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(SearchBar));
    await tester.pump();
    expect(bar.focusNode!.hasFocus, isTrue, reason: 'tapping the search bar must actually transition it to focused');
  });

  testWidgets('FollowUpListScreen: search bar wires a focus-bypass FocusNode (iOS Safari keyboard fix)', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/follow-up');
    await tester.pumpAndSettle();
    final bar = tester.widget<SearchBar>(find.byType(SearchBar));
    expect(bar.focusNode, isNotNull, reason: 'search field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(bar.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(SearchBar));
    await tester.pump();
    expect(bar.focusNode!.hasFocus, isTrue, reason: 'tapping the search bar must actually transition it to focused');
  });
}
