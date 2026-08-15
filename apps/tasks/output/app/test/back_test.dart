// [generated] generator=BackTestGenerator template=back_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_tasks/main.dart';
import 'package:rasheed_replica_tasks/core/router.dart';
import 'package:rasheed_replica_tasks/generated.dart';
import 'package:rasheed_replica_tasks/core/di.dart';

void main() {
  setUp(() => GetIt.instance.reset());

  testWidgets('Task: detail screen back button returns to the list', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/task');
    await tester.pumpAndSettle();
    appRouter.push('/task/x');
    await tester.pumpAndSettle();
    expect(find.byType(TaskDetailScreen), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(TaskListScreen), findsOneWidget);
  });

  testWidgets('FollowUp: detail screen back button returns to the list', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/follow-up');
    await tester.pumpAndSettle();
    appRouter.push('/follow-up/x');
    await tester.pumpAndSettle();
    expect(find.byType(FollowUpDetailScreen), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(FollowUpListScreen), findsOneWidget);
  });

  testWidgets('FollowUp: child list (via Task) back button returns to parent detail', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/task/x');
    await tester.pumpAndSettle();
    expect(find.byType(TaskDetailScreen), findsOneWidget);
    appRouter.push('/follow-up?taskId=x');
    await tester.pumpAndSettle();
    expect(find.byType(FollowUpListScreen), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(TaskDetailScreen), findsOneWidget);
  });
}
