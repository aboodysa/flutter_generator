// [generated] generator=BackTestGenerator template=back_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_hr_service/main.dart';
import 'package:rasheed_replica_hr_service/core/router.dart';
import 'package:rasheed_replica_hr_service/generated.dart';
import 'package:rasheed_replica_hr_service/core/di.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('LeaveRequest: detail screen back button returns to the list', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/leave-request');
    await tester.pumpAndSettle();
    appRouter.push('/leave-request/x');
    await tester.pumpAndSettle();
    expect(find.byType(LeaveRequestDetailScreen), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(LeaveRequestListScreen), findsOneWidget);
  });

  testWidgets('Approval: child list (via LeaveRequest) back button returns to parent detail', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/leave-request/x');
    await tester.pumpAndSettle();
    expect(find.byType(LeaveRequestDetailScreen), findsOneWidget);
    appRouter.push('/approval?leaveRequestId=x');
    await tester.pumpAndSettle();
    expect(find.byType(ApprovalListScreen), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(LeaveRequestDetailScreen), findsOneWidget);
  });
}
