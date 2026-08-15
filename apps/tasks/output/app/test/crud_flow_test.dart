// [generated] generator=CrudFlowTestGenerator template=crud_flow_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:rasheed_replica_tasks/main.dart';
import 'package:rasheed_replica_tasks/core/di.dart';

void main() {
  testWidgets('Task: create -> edit -> delete', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();

    // create (list FAB -> form -> submit -> lands on detail)
    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, 'Widget test value');
    await tester.tap(find.text('Create'));
    await tester.pumpAndSettle();
    expect(find.text('Widget test value'), findsOneWidget);

    // edit (detail AppBar action -> form, prefilled -> submit -> back on detail)
    await tester.tap(find.byIcon(Icons.edit));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, 'Widget test value updated');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(find.text('Widget test value updated'), findsOneWidget);

    // delete (detail AppBar action -> back on the list, row gone)
    await tester.tap(find.byIcon(Icons.delete));
    await tester.pumpAndSettle();
    expect(find.text('Widget test value updated'), findsNothing);
  });
}
