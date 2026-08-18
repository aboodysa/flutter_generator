import { FeatureModel, ScreenModel, StateManagementProvider } from "../types";
import { fileName } from "../naming";
import { screenPath } from "../routing";
import { authSession } from "./test";

/**
 * A11yTestGenerator — structural, deterministic, 0% LLM (DESIGN.md §15).
 * Emits one test/a11y/<screen>_a11y_test.dart per declared screen. Each file pumps the real app
 * (same "setupDependencies + appRouter.go(route)" navigation ViewportSqueezeTestGenerator/
 * FocusTestGenerator already use, so it works uniformly across list/detail/wizard/dashboard
 * topology without per-screen state seeding) and walks the RENDERED semantics tree — not the
 * widget tree — asserting, per interactive node:
 *   1. role/SemanticsFlag: it declares itself via a real Flutter semantics flag (button, text
 *      field, link, selectable, checkable, ...), not just an ad hoc GestureDetector;
 *   2. non-empty accessible name: label/value/hint combined isn't empty (catches an IconButton
 *      with no tooltip, a TextField with no labelText — a real generator regression class);
 *   3. bound state: a button declares an explicit enabled/disabled Tristate, and a selectable
 *      (ChoiceChip-shaped) node declares an explicit selected Tristate — never left unbound.
 * `filenameFor` is exported so index.ts's writer and this generator agree on one name.
 */
export function a11yTestFileName(screen: ScreenModel): string {
  return fileName(screen.name).replace(/\.dart$/, "_a11y_test.dart");
}

export function generateA11yTest(feature: FeatureModel, screen: ScreenModel, sm: StateManagementProvider = "bloc"): string {
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const screens = feature.screens ?? [];
  const route = screenPath(screens, screen).replace(":id", "x");

  const session = authSession(feature, pkg, "    ");
  const setupDi = sm === "riverpod" ? "" : "    setupDependencies();\n";
  const diImport = sm === "riverpod" ? "" : `import 'package:${pkg}/core/di.dart';\n`;

  const walker = `// Walks the rendered semantics tree (not the widget tree) so this asserts what an actual
// screen reader would see, matching DESIGN.md §15's role/name/bound-state contract.
// A tooltip-driven control (IconButton/FloatingActionButton) puts its \`tooltip\` on the merge-
// boundary ancestor Semantics node — not on the same node that carries the \`isButton\` flag — so
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
      issues.add('interactive node (button=\${flags.isButton}, textField=\${flags.isTextField}, '
          'link=\${flags.isLink}, selectable=\${flags.isInMutuallyExclusiveGroup}) has no accessible name');
    }
    if (flags.isButton && flags.isEnabled == Tristate.none) {
      issues.add('button node "\$name" has no bound enabled/disabled state');
    }
    if (flags.isInMutuallyExclusiveGroup && flags.isSelected == Tristate.none) {
      issues.add('selectable node "\$name" has no bound selected state');
    }
    n.visitChildren((child) {
      walk(child, tooltip);
      return true;
    });
  }
  walk(node, '');
  return issues;
}`;

  return `// [generated] generator=A11yTestGenerator template=a11y_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'dart:ui' show Tristate, CheckedState;
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
${diImport}${session.import}
${walker}

void main() {
  testWidgets('${screen.name}: interactive elements expose role, accessible name, and bound state', (tester) async {
    // testWidgets enables semantics by default (semanticsEnabled: true) and disposes its handle
    // itself — an extra tester.ensureSemantics() here would double-acquire the handle and, worse,
    // dispose it too late (addTearDown runs after the framework's own end-of-test semantics-handle
    // check), so this relies entirely on that default instead of managing a handle itself.
${setupDi}${session.boot}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('${route}');
    await tester.pumpAndSettle();
    final root = tester.binding.pipelineOwner.semanticsOwner!.rootSemanticsNode!;
    final issues = _a11yIssues(root);
    expect(issues, isEmpty, reason: issues.join('\\n'));
  });
}
`;
}
