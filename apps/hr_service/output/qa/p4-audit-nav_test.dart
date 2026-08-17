// TEMP QA harness (P4 audit navigation, rule 12) — drives the real router, logs in as a persona,
// opens a leave-request detail, opens the overflow menu, taps Audit, asserts we land on the
// audit-log screen. Verifies the generator's audit action + overflow menu navigation reliably
// (Flutter's own test framework drives PopupMenuButton deterministically, unlike CDP geometry).
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:rasheed_replica_hr_service/main.dart' as app;
import 'package:rasheed_replica_hr_service/core/di.dart';

void main() {
  testWidgets('P4: audited leave-request detail -> overflow menu -> Audit log navigates', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const app.ReplicaApp());
    await tester.pumpAndSettle();

    // sign in as a persona that can reach leave requests
    await tester.tap(find.textContaining('Demo Hr_admin'));
    await tester.pumpAndSettle();

    // first leave request card -> detail
    await tester.tap(find.textContaining('Sample LeaveRequest').first);
    await tester.pumpAndSettle();
    expect(find.textContaining('Leave Request details'), findsOneWidget);

    // Edit inline + overflow menu present (P4 fixture)
    expect(find.byIcon(Icons.edit), findsOneWidget);
    await tester.tap(find.byTooltip('More actions'));
    await tester.pumpAndSettle();
    expect(find.text('Delete'), findsOneWidget); // delete overflowed into menu
    expect(find.text('Audit log'), findsOneWidget); // audit in menu

    // tap Audit -> audit-log screen
    await tester.tap(find.text('Audit log'));
    await tester.pumpAndSettle();
    expect(find.text('Audit log'), findsWidgets); // AppBar title of the audit screen
    await tester.pumpAndSettle();
  });
}
