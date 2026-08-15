import { FeatureModel, Field, StateManagementProvider } from "../types";
import { crudFormTargets, isMoneyField } from "../operations";

/**
 * UnitTestGenerator — structural, deterministic, 0% LLM.
 * Emits a model round-trip + entity equality unit test for the first entity.
 */
export function generateUnitTest(feature: FeatureModel): string {
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const entity = feature.entities[0];
  if (!entity) {
    return `// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('vanilla app has no domain entities to test', () {
    expect(true, isTrue);
  });
}
`;
  }
  const model = `${entity.name}Model`;

  const jsonSample = (f: Field): string => {
    if (isMoneyField(f)) return `{'minorUnits': 0, 'currency': '${f.currency}'}`;
    if (f.semanticType) {
      const vo = (feature.valueObjects ?? []).find((v) => v.name === f.semanticType);
      return vo?.baseType === "String" ? "'x'" : vo?.baseType === "int" ? "0" : "0.0";
    }
    switch (f.type) {
      case "String": return "'x'";
      case "int": return "0";
      case "double": return "0.0";
      case "bool": return "false";
      case "DateTime": return "'2024-01-01T00:00:00.000Z'";
      case "enum": {
        const e = (feature.enums ?? []).find((x) => x.name === (f.of || ""));
        return `'${e?.values?.[0] ?? "x"}'`;
      }
      case "List": return "[]";
      case "reference": return "{}";
      default: return "null";
    }
  };

  const jsonEntries = entity.fields
    .filter((f) => f.required)
    .map((f) => `        '${f.name}': ${jsonSample(f)},`)
    .join("\n");

  const dartSample = (f: Field): string => {
    if (isMoneyField(f)) return `Money(minorUnits: 0, currency: '${f.currency}')`;
    if (f.semanticType) {
      const vo = (feature.valueObjects ?? []).find((v) => v.name === f.semanticType);
      return `${f.semanticType}(${vo?.baseType === "String" ? "'x'" : "0"})`;
    }
    switch (f.type) {
      case "String": return "'x'";
      case "int": return "0";
      case "double": return "0.0";
      case "bool": return "false";
      case "DateTime": return "DateTime(2024)";
      case "enum": return `${f.of ?? "Object"}.values.first`;
      case "List": return "const []";
      case "reference": return "null";
      default: return "null";
    }
  };

  const ctorArgs = entity.fields
    .filter((f) => f.required)
    .map((f) => `${f.name}: ${dartSample(f)}`)
    .join(", ");

  return `// [generated] generator=UnitTestGenerator template=unit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/generated.dart';

void main() {
  test('${model} fromJson/toJson round-trips without throwing', () {
    final json = <String, dynamic>{
${jsonEntries}
    };
    final m = ${model}.fromJson(json);
    expect(m.toJson(), isNotEmpty);
  });

  test('${entity.name} equality by identity', () {
    final a = ${entity.name}(${ctorArgs});
    expect(a, equals(a));
  });
}
`;
}

/**
 * GoldenTestGenerator — structural, deterministic, 0% LLM.
 * Emits a golden (screenshot) regression test for the first screen.
 */
export function generateGoldenTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string {
  const screen = feature.screens?.[0];
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

  // Load the real Roboto font (bundled via pubspec `fonts:`): otherwise the test runner's
  // default "FlutterTest" font renders every glyph as a solid box.
  const fontLoader = `  setUpAll(() async {
    final font = FontLoader('Roboto');
    for (final f in const ['Roboto-Regular', 'Roboto-Medium', 'Roboto-Bold']) {
      font.addFont(rootBundle.load('assets/fonts/\$f.ttf'));
    }
    await font.load();
    final icons = FontLoader('MaterialIcons')
      ..addFont(rootBundle.load('assets/fonts/MaterialIcons-Regular.otf'));
    await icons.load();
  });`;

  if (!screen) {
    return `// [generated] generator=GoldenTestGenerator template=golden.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:${pkg}/main.dart';
import 'package:flutter/material.dart';

void main() {
${fontLoader}

  testWidgets('app renders (golden)', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(const ReplicaApp());
    await expectLater(find.byType(Scaffold), matchesGoldenFile('goldens/app.png'));
  });
}
`;
  }

  const goldenName = screen.name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  // bloc: BlocProvider wraps the screen; riverpod: ProviderScope (notifier.build() seeds data).
  // theme: buildTheme() sets fontFamily Roboto so real glyphs render (not boxes).
  const pumpWidget = sm === "riverpod"
    ? `    await tester.pumpWidget(ProviderScope(
      child: MaterialApp(theme: buildTheme(), home: ${screen.name}()),
    ));`
    : `    await tester.pumpWidget(BlocProvider<${screen.state}Cubit>(
      create: (_) => sl<${screen.state}Cubit>()..load(),
      child: MaterialApp(theme: buildTheme(), home: ${screen.name}()),
    ));`;
  const libImport = sm === "riverpod"
    ? `import 'package:flutter_riverpod/flutter_riverpod.dart';`
    : `import 'package:flutter_bloc/flutter_bloc.dart';`;
  const diImport = sm === "riverpod" ? "" : `import 'package:${pkg}/core/di.dart';`;
  const setupDi = sm === "riverpod" ? "" : `    setupDependencies();`;

  // iPhone-size viewport so goldens reflect a real phone screen, not the 800×600 test default.
  const surface = `    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);`;

  return `// [generated] generator=GoldenTestGenerator template=golden_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
${libImport}
${diImport}import 'package:${pkg}/generated.dart';
import 'package:${pkg}/core/theme.dart';
import 'package:flutter/material.dart';

void main() {
${fontLoader}

  testWidgets('${screen.name} renders (golden)', (tester) async {
${setupDi}
${surface}
${pumpWidget}
    await tester.pumpAndSettle();
    await expectLater(find.byType(${screen.name}), matchesGoldenFile('goldens/${goldenName}.png'));
  });
}
`;
}

/**
 * FlowTestGenerator — structural, deterministic, 0% LLM.
 * Emits a widget-level integration flow test (pump the whole app, verify the screen renders).
 */
export function generateFlowTest(feature: FeatureModel): string {
  const screens = feature.screens ?? [];
  const detail = screens.find((s) => s.type === "detail");
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

  const generatedImport = detail ? `import 'package:${pkg}/generated.dart';` : "";
  const nav = detail
    ? `    await tester.tap(find.byType(ListTile).first);
    await tester.pumpAndSettle();
    expect(find.byType(${detail.name}), findsOneWidget);`
    : "";

  return `// [generated] generator=FlowTestGenerator template=flow.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/di.dart';
import 'package:flutter/material.dart';
${generatedImport}

void main() {
  testWidgets('app boots and navigates', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    expect(find.byType(Scaffold), findsWidgets);
${nav}
  });
}
`;
}

/**
 * CrudFlowTestGenerator — structural, deterministic, 0% LLM (§5.2-F1 CRUD proof).
 * Drives the real generated widget tree end to end: create (via the list FAB) -> visible on the
 * detail screen it navigates to -> edit (via the detail AppBar action) -> visible updated ->
 * delete (via the detail AppBar action) -> gone. Only emitted when an entity has a synthesized
 * form (crudFormTargets — create+update), a delete operation, AND a detail screen to land on
 * (today: entities with a "list" + "detail" screen pair whose repository is full-CRUD). Targets
 * the first rendered TextField, which is the entity's first non-identity field in IR order — the
 * common "title/name first" shape (documented assumption, not a general-purpose heuristic).
 */
export function generateCrudFlowTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string | null {
  const target = [...crudFormTargets(feature).values()].find(
    (t) => t.delete && (feature.screens ?? []).some((s) => s.entity === t.entity && s.type === "detail"),
  );
  if (!target) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const setup = sm === "bloc" ? "    setupDependencies();\n" : "";
  const diImport = sm === "bloc" ? `import 'package:${pkg}/core/di.dart';\n` : "";

  return `// [generated] generator=CrudFlowTestGenerator template=crud_flow_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:${pkg}/main.dart';
${diImport}
void main() {
  testWidgets('${target.entity}: create -> edit -> delete', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();

    // create (list FAB -> form -> submit -> lands on detail)
    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, 'Widget test value');
    await tester.tap(find.text('Create'));
    await tester.pumpAndSettle();
    expect(find.text('Widget test value'), findsOneWidget);

    // edit (detail AppBar action -> form, prefilled -> submit -> back on detail)
    await tester.tap(find.byIcon(Icons.edit));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, 'Widget test value updated');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(find.text('Widget test value updated'), findsOneWidget);

    // delete (detail AppBar action -> back on the list, row gone)
    await tester.tap(find.byIcon(Icons.delete));
    await tester.pumpAndSettle();
    expect(find.text('Widget test value updated'), findsNothing);
  });
}
`;
}
