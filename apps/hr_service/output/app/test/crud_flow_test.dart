// [generated] generator=CrudFlowTestGenerator template=crud_flow_bloc.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:rasheed_replica_hr_service/main.dart';
import 'package:rasheed_replica_hr_service/core/di.dart';

import 'package:rasheed_replica_hr_service/core/session.dart';

void main() {
  testWidgets('LeaveRequest: create -> edit -> delete', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();

    // create (list FAB -> form -> submit -> lands on detail)
    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, 'Widget test value');
    await tester.tap(find.widgetWithText(ChoiceChip, 'approved'));
    await tester.pumpAndSettle();
    expect(tester.widget<ChoiceChip>(find.widgetWithText(ChoiceChip, 'approved')).selected, isTrue, reason: 'tapping a chip must select it (onSelected wiring)');
    expect(tester.widget<ChoiceChip>(find.widgetWithText(ChoiceChip, 'open')).selected, isFalse, reason: 'selecting a new chip must deselect the previous one');
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

    // delete (detail action -> P4 confirm dialog -> confirm -> back on the list, row gone).
    // When actionsFor overflowed Delete into the "…" menu (a >2-action detail), open the overflow
    // menu and pick Delete first; otherwise Delete is an inline AppBar icon. Then the confirm
    // dialog appears either way.
        await tester.tap(find.byIcon(Icons.more_vert));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Delete'));
    await tester.pumpAndSettle();
    expect(find.text('Delete LeaveRequest?'), findsOneWidget); // P4 confirm dialog present
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();
    expect(find.text('Widget test value updated'), findsNothing);
  });
}
