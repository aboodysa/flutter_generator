// QA scratch probe (P2_IMPLEMENTATION_BRIEF.md deliverable 6's overflow scan) — NOT generated,
// NOT part of the app's regular test suite. Same rationale as P1's overflow_probe_test.dart
// (apps/ledgerly/output/qa/p1-shell/): the claude-in-chrome browser session in this environment
// could not resize its actual rendered viewport to the four required widths, so this substitutes
// a directly-controlled Flutter widget-test viewport (tester.view.physicalSize) to prove the
// actual requirement — no RenderFlex overflow with the SearchBar + filtered list + no-results
// EmptyState — at each of 320/390/768/1280. Copied into apps/ledgerly/output/app/test/ to run
// (needs that project's pubspec/package resolution) and removed again afterward; this file's
// permanent home is this qa/ directory, not the generated test suite.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:rasheed_replica_ledgerly/main.dart';
import 'package:rasheed_replica_ledgerly/core/di.dart';
import 'package:rasheed_replica_ledgerly/core/session.dart';

const _sizes = <String, Size>{
  '320w (small phone)': Size(320, 800),
  '390w (iPhone-class)': Size(390, 844),
  '768w (tablet)': Size(768, 1024),
  '1280w (desktop)': Size(1280, 800),
};

void main() {
  for (final entry in _sizes.entries) {
    testWidgets('Approvals search renders with no overflow at ${entry.key}', (tester) async {
      tester.view.physicalSize = entry.value;
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await GetIt.instance.reset();
      setupDependencies();
      // finance reaches /approval as home and can see all 3 seeded rows.
      Session.instance.signIn(role: 'finance', actorId: 'user-3', tenantId: 'acme', displayName: 'Rana Yousef');
      await tester.pumpWidget(const ReplicaApp());
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'boot at ${entry.key}');
      expect(find.byType(SearchBar), findsOneWidget);

      // Type a filter that matches one row — SearchBar has no dedicated onChanged test hook, so
      // drive it the same way a real user would: enter text, then verify the filtered result.
      await tester.enterText(find.byType(SearchBar), '1');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'filtered render at ${entry.key}');
      expect(find.text('Sample Approval 1'), findsOneWidget);
      expect(find.text('Sample Approval'), findsNothing);

      // No-results EmptyState.
      await tester.enterText(find.byType(SearchBar), 'zzqqxx');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'no-results render at ${entry.key}');
      expect(find.textContaining('No results for'), findsOneWidget);

      // Clear restores the full list.
      await tester.enterText(find.byType(SearchBar), '');
      await tester.pumpAndSettle();
      expect(tester.takeException(), isNull, reason: 'cleared render at ${entry.key}');
      expect(find.text('Sample Approval'), findsOneWidget);
      expect(find.text('Sample Approval 1'), findsOneWidget);
      expect(find.text('Sample Approval 2'), findsOneWidget);
    });
  }
}
