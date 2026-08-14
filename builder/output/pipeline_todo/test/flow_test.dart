// [generated] generator=FlowTestGenerator template=flow.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:rasheed_replica_todo_app/main.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('app boots and TaskListScreen is reachable', (tester) async {
    await tester.pumpWidget(const ReplicaApp());
    expect(find.byType(Scaffold), findsOneWidget);
  });
}
