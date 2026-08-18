// [generated] generator=A11yTestGenerator template=a11y_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'dart:ui' show Tristate, CheckedState;
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:rasheed_replica_ledgerly/main.dart';
import 'package:rasheed_replica_ledgerly/core/router.dart';
import 'package:rasheed_replica_ledgerly/core/di.dart';
import 'package:rasheed_replica_ledgerly/core/session.dart';

// Walks the rendered semantics tree (not the widget tree) so this asserts what an actual
// screen reader would see, matching DESIGN.md §15's role/name/bound-state contract.
// A tooltip-driven control (IconButton/FloatingActionButton) puts its `tooltip` on the merge-
// boundary ancestor Semantics node — not on the same node that carries the `isButton` flag — so
// the nearest ancestor tooltip is threaded down and counted toward the descendant's accessible
// name, matching how an accessibility service actually merges the two before announcing them.
List<String> _a11yIssues(SemanticsNode node) {
  final issues = <String>[];
  void walk(SemanticsNode n, String inheritedTooltip) {
    final data = n.getSemanticsData();
    final tooltip = data.tooltip.trim().isNotEmpty ? data.tooltip.trim() : inheritedTooltip;
    final flags = data.flagsCollection;
    final name = [data.label, data.value, data.hint, tooltip].where((s) => s.trim().isNotEmpty).join(' ').trim();
    final interactive = flags.isButton ||
        flags.isTextField ||
        flags.isLink ||
        flags.isSlider ||
        flags.isInMutuallyExclusiveGroup ||
        flags.isToggled != Tristate.none ||
        flags.isChecked != CheckedState.none;
    if (interactive && name.isEmpty) {
      issues.add('interactive node (button=${flags.isButton}, textField=${flags.isTextField}, '
          'link=${flags.isLink}, selectable=${flags.isInMutuallyExclusiveGroup}) has no accessible name');
    }
    if (flags.isButton && flags.isEnabled == Tristate.none) {
      issues.add('button node "$name" has no bound enabled/disabled state');
    }
    if (flags.isInMutuallyExclusiveGroup && flags.isSelected == Tristate.none) {
      issues.add('selectable node "$name" has no bound selected state');
    }
    n.visitChildren((child) {
      walk(child, tooltip);
      return true;
    });
  }
  walk(node, '');
  return issues;
}

void main() {
  testWidgets('UserListScreen: interactive elements expose role, accessible name, and bound state', (tester) async {
    // testWidgets enables semantics by default (semanticsEnabled: true) and disposes its handle
    // itself — an extra tester.ensureSemantics() here would double-acquire the handle and, worse,
    // dispose it too late (addTearDown runs after the framework's own end-of-test semantics-handle
    // check), so this relies entirely on that default instead of managing a handle itself.
    setupDependencies();
    Session.instance.signIn(role: 'employee', actorId: 'user-1', tenantId: 'acme', displayName: 'Sara Ahmed');
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/user');
    await tester.pumpAndSettle();
    final root = tester.binding.pipelineOwner.semanticsOwner!.rootSemanticsNode!;
    final issues = _a11yIssues(root);
    expect(issues, isEmpty, reason: issues.join('\n'));
  });
}
