// [qa] S1 visualIntproof capture — NOT generated. QA evidence harness.
// Pumps the real app router at a proof route (FontLoader + buildTheme via ReplicaApp).
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_hr_service/main.dart';
import 'package:rasheed_replica_hr_service/core/router.dart';
import 'package:rasheed_replica_hr_service/generated.dart';
import 'package:rasheed_replica_hr_service/core/di.dart';

void main() {
  setUpAll(() async {
    final font = FontLoader('Roboto');
    for (final f in const ['Roboto-Regular', 'Roboto-Medium', 'Roboto-Bold']) {
      font.addFont(rootBundle.load('assets/fonts/$f.ttf'));
    }
    await font.load();
    final icons = FontLoader('MaterialIcons')
      ..addFont(rootBundle.load('assets/fonts/MaterialIcons-Regular.otf'));
    await icons.load();
  });

  setUp(() => GetIt.instance.reset());

  testWidgets('S1 proof: LeaveRequestDetailScreen (professional/sharp/strong) golden', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/leave-request/x');
    await tester.pumpAndSettle();
    await expectLater(find.byType(LeaveRequestDetailScreen), matchesGoldenFile('goldens/s1_leave_request_detail_screen.png'));
  });
}