// [generated] generator=QuickDecisionTestGenerator template=quick_decision_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_ledgerly/main.dart';
import 'package:rasheed_replica_ledgerly/core/router.dart';
import 'package:rasheed_replica_ledgerly/core/components.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';
import 'package:rasheed_replica_ledgerly/core/di.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('Approval: quick decision action flips decision', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/approval');
    await tester.pumpAndSettle();
    // Scoped to ApprovalListScreen specifically — go_router's Navigator stack keeps the previous
    // (pushed-from) route's widgets findable too, and it can carry its own AppListCard rows.
    final screenFinder = find.byType(ApprovalListScreen);
    final card = find.descendant(of: screenFinder, matching: find.byType(AppListCard)).first;
    final action = find.descendant(of: card, matching: find.byType(IconButton)).first;
    final target = tester.widget<IconButton>(action).tooltip!;
    await tester.tap(action);
    await tester.pumpAndSettle();
    expect(find.descendant(of: screenFinder, matching: find.text(target)), findsWidgets, reason: 'tapping the quick-decision action must flip decision to the tapped value');
  });
}
