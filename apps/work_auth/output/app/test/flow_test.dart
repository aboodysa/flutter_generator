// [generated] generator=FlowTestGenerator template=flow.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_work_auth/main.dart';
import 'package:rasheed_replica_work_auth/core/di.dart';
import 'package:flutter/material.dart';


void main() {
  testWidgets('app boots and navigates', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    expect(find.byType(Scaffold), findsWidgets);

  });
}
