// QA scratch probe (P2_IMPLEMENTATION_BRIEF.md deliverable 6's overflow scan) — NOT generated,
// NOT part of the app's regular test suite. See apps/ledgerly/output/qa/p2-search/
// overflow_probe_test.dart for the full rationale (browser resize_window was non-functional in
// this session; tester.view.physicalSize substitutes a directly-controlled, equally rigorous
// proof at the four required breakpoints). Copied into apps/tasks/output/app/test/ to run and
// removed again afterward.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_tasks/main.dart';
import 'package:rasheed_replica_tasks/core/di.dart';

const _sizes = <String, Size>{
  '320w (small phone)': Size(320, 800),
  '390w (iPhone-class)': Size(390, 844),
  '768w (tablet)': Size(768, 1024),
  '1280w (desktop)': Size(1280, 800),
};

void main() {
  for (final entry in _sizes.entries) {
    testWidgets('Tasks search renders with no overflow at ${entry.key}', (tester) async {
      tester.view.physicalSize = entry.value;
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await GetIt.instance.reset();
      setupDependencies();
      await tester.pumpWidget(const ReplicaApp());
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'boot at ${entry.key}');
      expect(find.byType(SearchBar), findsOneWidget);

      await tester.enterText(find.byType(SearchBar), '2');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'filtered render at ${entry.key}');
      expect(find.text('Sample Task 2'), findsOneWidget);
      expect(find.text('Sample Task'), findsNothing);

      await tester.enterText(find.byType(SearchBar), 'zzqqxx');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'no-results render at ${entry.key}');
      expect(find.textContaining('No results for'), findsOneWidget);

      await tester.enterText(find.byType(SearchBar), '');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'cleared render at ${entry.key}');
      expect(find.text('Sample Task'), findsOneWidget);
      expect(find.text('Sample Task 1'), findsOneWidget);
      expect(find.text('Sample Task 2'), findsOneWidget);
    });
  }
}
