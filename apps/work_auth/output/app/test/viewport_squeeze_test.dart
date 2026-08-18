// [generated] generator=ViewportSqueezeTestGenerator template=viewport_squeeze.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_work_auth/main.dart';
import 'package:rasheed_replica_work_auth/core/router.dart';
import 'package:rasheed_replica_work_auth/core/di.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('WorkAuthListScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/work-auth');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'WorkAuthListScreen must not overflow at 320x480');
  });

  testWidgets('WorkAuthListScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/work-auth');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'WorkAuthListScreen must not overflow at 390x844');
  });

  testWidgets('WorkAuthListScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/work-auth');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'WorkAuthListScreen must not overflow at 1400x900');
  });

  testWidgets('VisaQuotaListScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/visa-quota');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'VisaQuotaListScreen must not overflow at 320x480');
  });

  testWidgets('VisaQuotaListScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/visa-quota');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'VisaQuotaListScreen must not overflow at 390x844');
  });

  testWidgets('VisaQuotaListScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/visa-quota');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'VisaQuotaListScreen must not overflow at 1400x900');
  });

  testWidgets('VisaQuotaDetailScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/visa-quota/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'VisaQuotaDetailScreen must not overflow at 320x480');
  });

  testWidgets('VisaQuotaDetailScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/visa-quota/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'VisaQuotaDetailScreen must not overflow at 390x844');
  });

  testWidgets('VisaQuotaDetailScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/visa-quota/x');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'VisaQuotaDetailScreen must not overflow at 1400x900');
  });

  testWidgets('WorkAuthWizardScreen: no overflow at 320x480', (tester) async {
    tester.view.physicalSize = const Size(320, 480);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/work-auth/wizard');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'WorkAuthWizardScreen must not overflow at 320x480');
  });

  testWidgets('WorkAuthWizardScreen: no overflow at 390x844', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/work-auth/wizard');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'WorkAuthWizardScreen must not overflow at 390x844');
  });

  testWidgets('WorkAuthWizardScreen: no overflow at 1400x900', (tester) async {
    tester.view.physicalSize = const Size(1400, 900);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/work-auth/wizard');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'WorkAuthWizardScreen must not overflow at 1400x900');
  });
}
