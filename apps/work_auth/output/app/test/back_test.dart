// [generated] generator=BackTestGenerator template=back_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_work_auth/main.dart';
import 'package:rasheed_replica_work_auth/core/router.dart';
import 'package:rasheed_replica_work_auth/generated.dart';
import 'package:rasheed_replica_work_auth/core/di.dart';


void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('VisaQuota: detail screen back button returns to the list', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/visa-quota');
    await tester.pumpAndSettle();
    appRouter.push('/visa-quota/x');
    await tester.pumpAndSettle();
    expect(find.byType(VisaQuotaDetailScreen), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(VisaQuotaListScreen), findsOneWidget);
  });
}
