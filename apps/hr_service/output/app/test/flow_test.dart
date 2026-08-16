// [generated] generator=FlowTestGenerator template=flow.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_hr_service/main.dart';
import 'package:rasheed_replica_hr_service/core/di.dart';
import 'package:flutter/material.dart';
import 'package:rasheed_replica_hr_service/generated.dart';
import 'package:rasheed_replica_hr_service/core/session.dart';

void main() {
  testWidgets('app boots and navigates', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    expect(find.byType(Scaffold), findsWidgets);
    await tester.tap(find.byType(ListTile).first);
    await tester.pumpAndSettle();
    expect(find.byType(LeaveRequestDetailScreen), findsOneWidget);
  });
}
