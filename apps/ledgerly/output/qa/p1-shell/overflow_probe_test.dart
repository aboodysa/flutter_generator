// QA scratch probe (P1_IMPLEMENTATION_BRIEF.md §4 step 5's overflow scan) — NOT generated, NOT
// part of the app's regular test suite. The claude-in-chrome browser session in this environment
// could not resize its actual rendered viewport (window.innerWidth stayed fixed regardless of
// resize_window/zoom-shortcut calls — see P1-shell-cdp-walk.md's "Overflow scan" section for the
// full account), so this file substitutes a directly-controlled Flutter widget-test viewport
// (tester.view.physicalSize, the same mechanism golden_test.dart/scroll_test.dart already use for
// their own fixed-size renders) to prove the actual requirement — no RenderFlex overflow on any
// shell destination — at each of the four required breakpoints. Copied into
// apps/ledgerly/output/app/test/ to run (needs that project's pubspec/package resolution) and
// removed again afterward; this file's permanent home is this qa/ directory, not the generated
// test/ suite.
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

const _destinations = ['Users', 'Expense Claims', 'Approvals', 'Meal Budgets'];

void main() {
  for (final entry in _sizes.entries) {
    testWidgets('shell renders every destination with no overflow at ${entry.key}', (tester) async {
      tester.view.physicalSize = entry.value;
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await GetIt.instance.reset();
      setupDependencies();
      Session.instance.signIn(role: 'finance', actorId: 'user-3', tenantId: 'acme', displayName: 'Rana Yousef');
      await tester.pumpWidget(const ReplicaApp());
      await tester.pumpAndSettle();

      for (final label in _destinations) {
        await tester.tap(find.text(label).first);
        await tester.pumpAndSettle();
        expect(tester.takeException(), isNull, reason: 'overflow/exception tapping $label at ${entry.key}');
        expect(find.text(label), findsWidgets);
      }
    });
  }
}
