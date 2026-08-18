// [generated] generator=ViewportSqueezeTestGenerator template=viewport_squeeze.v1 class=structural ownership=generated
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

  testWidgets('LeaveRequestListScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/leave-request');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'LeaveRequestListScreen must not overflow at 320x480');
  });

  testWidgets('LeaveRequestListScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/leave-request');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'LeaveRequestListScreen must not overflow at 390x844');
  });

  testWidgets('LeaveRequestListScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/leave-request');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'LeaveRequestListScreen must not overflow at 1400x900');
  });

  testWidgets('LeaveRequestDetailScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/leave-request/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'LeaveRequestDetailScreen must not overflow at 320x480');
  });

  testWidgets('LeaveRequestDetailScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/leave-request/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'LeaveRequestDetailScreen must not overflow at 390x844');
  });

  testWidgets('LeaveRequestDetailScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/leave-request/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'LeaveRequestDetailScreen must not overflow at 1400x900');
  });

  testWidgets('ApprovalListScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/approval');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'ApprovalListScreen must not overflow at 320x480');
  });

  testWidgets('ApprovalListScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/approval');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'ApprovalListScreen must not overflow at 390x844');
  });

  testWidgets('ApprovalListScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/approval');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'ApprovalListScreen must not overflow at 1400x900');
  });
}
