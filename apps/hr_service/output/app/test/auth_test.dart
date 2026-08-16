// [generated] generator=AuthTestGenerator template=auth.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_hr_service/main.dart';
import 'package:rasheed_replica_hr_service/core/router.dart';
import 'package:rasheed_replica_hr_service/core/di.dart';
import 'package:rasheed_replica_hr_service/generated.dart';

void main() {
  // GetIt reset + signOut so each test starts fresh (Session is a plucked singleton, not in GetIt).
  setUp(() {
    GetIt.instance.reset();
    Session.instance.signOut();
  });

  testWidgets('login presents every persona from IR', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    expect(find.byType(AuthLoginScreen), findsOneWidget);
    expect(find.text('Sara Ahmed'), findsWidgets);
    expect(find.text('Demo Hr_admin'), findsWidgets);
  });

  testWidgets('unauthenticated deep link redirects to login', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/leave-request');
    await tester.pumpAndSettle();
    expect(find.byType(AuthLoginScreen), findsOneWidget);
  });

  testWidgets('tapping a persona signs in and lands on the employee home', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sara Ahmed').last);
    await tester.pumpAndSettle();
    expect(Session.instance.isAuthenticated, isTrue);
    expect(Session.instance.role, 'employee');
    expect(Session.instance.displayName, 'Sara Ahmed');
    expect(Session.instance.tenantId, 'acme');
    expect(appRouter.routerDelegate.currentConfiguration.uri.path, '/leave-request');
    expect(find.byType(LeaveRequestListScreen), findsOneWidget);
  });

  testWidgets('sign out returns to login gate', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('Sara Ahmed').last);
    await tester.pumpAndSettle();
    expect(Session.instance.isAuthenticated, isTrue);
    Session.instance.signOut();
    await tester.pumpAndSettle();
    appRouter.go('/leave-request');
    await tester.pumpAndSettle();
    expect(Session.instance.isAuthenticated, isFalse);
    expect(find.byType(AuthLoginScreen), findsOneWidget);
  });
}
