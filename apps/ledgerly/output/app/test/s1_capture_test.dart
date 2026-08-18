// [qa] S1 visualIntent proof capture — NOT generated. QA evidence harness.
// Pumps the real app router at a proof route (FontLoader + buildTheme via ReplicaApp).
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_ledgerly/main.dart';
import 'package:rasheed_replica_ledgerly/core/router.dart';
import 'package:rasheed_replica_ledgerly/generated.dart';
import 'package:rasheed_replica_ledgerly/core/di.dart';

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

  testWidgets('S1 proof: ExpenseClaimListScreen (premium/soft) golden', (tester) async {
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/expense-claim');
    await tester.pumpAndSettle();
    await tester.pump(const Duration(seconds: 1));
    await expectLater(find.byType(ExpenseClaimListScreen), matchesGoldenFile('goldens/s1_expense_claim_list_screen.png'));
  });
}