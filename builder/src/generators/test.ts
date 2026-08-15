import { FeatureModel, Field, StateManagementProvider } from "../types";
import { crudFormTargets, isMoneyField, firstCrudTextField, firstAutofocusableField, findRepoForEntity } from "../operations";
import { kebab, collectionField, camelize } from "../naming";
import { variantSampleArgs } from "../sampling";
import { childLinks } from "./screen";

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
 * the first rendered TextField (firstCrudTextField, shared with crud_form.ts's own field order —
 * the common "title/name first" shape, documented assumption not a general-purpose heuristic).
 *
 * L1b: when that first TextField is money-typed (crud_form.ts parses it as decimal -> minor
 * units), typing a plain string like a non-money field would silently produce
 * `Money(minorUnits: 0, ...)` — the assertion would then pass for the wrong reason (an empty/zero
 * amount, not the typed value). So a money field types a decimal string and asserts the rendered
 * `Money.format()` output instead of the raw typed text.
 */
export function generateCrudFlowTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string | null {
  const target = [...crudFormTargets(feature).values()].find(
    (t) => t.delete && (feature.screens ?? []).some((s) => s.entity === t.entity && s.type === "detail"),
  );
  if (!target) return null;

  const entity = feature.entities.find((e) => e.name === target.entity);
  const identityField = entity?.identity?.field ?? "id";
  const firstField = entity ? firstCrudTextField(entity, identityField) : undefined;
  const money = !!firstField && isMoneyField(firstField);
  const currency = firstField?.currency ?? "SAR";

  const createValue = money ? "1250.50" : "Widget test value";
  const updateValue = money ? "1999.25" : "Widget test value updated";
  const createExpect = money ? `1,250.50 ${currency}` : createValue;
  const updateExpect = money ? `1,999.25 ${currency}` : updateValue;

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
    await tester.enterText(find.byType(TextField).first, '${createValue}');
    await tester.tap(find.text('Create'));
    await tester.pumpAndSettle();
    expect(find.text('${createExpect}'), findsOneWidget);

    // edit (detail AppBar action -> form, prefilled -> submit -> back on detail)
    await tester.tap(find.byIcon(Icons.edit));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, '${updateValue}');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(find.text('${updateExpect}'), findsOneWidget);

    // delete (detail AppBar action -> back on the list, row gone)
    await tester.tap(find.byIcon(Icons.delete));
    await tester.pumpAndSettle();
    expect(find.text('${updateExpect}'), findsNothing);
  });
}
`;
}

/**
 * FocusTestGenerator — structural, deterministic, 0% LLM (RCA-005 / Bug A regression guard).
 * For every entity with a synthesized CRUD form, drives the real app straight to that entity's
 * create route via `appRouter.go(...)` (bypassing UI navigation — the create route can be several
 * hops deep, e.g. a child entity reached only through a parent's detail screen, so tapping through
 * would make this test's shape depend on each app's specific navigation graph) and asserts the
 * autofocus target field (operations.ts's firstAutofocusableField — the SAME field crud_form.ts
 * itself autofocuses) actually carries `autofocus: true`. A precise, deterministic check on the
 * rendered widget's own configuration — no reliance on FocusNode timing, so it can't be flaky.
 */
export function generateFocusTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string | null {
  const targets = [...crudFormTargets(feature).values()];
  if (!targets.length) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const setup = sm === "bloc" ? "    setupDependencies();\n" : "";
  const diImport = sm === "bloc" ? `import 'package:${pkg}/core/di.dart';\n` : "";

  const cases = targets.map((t) => {
    const entity = feature.entities.find((e) => e.name === t.entity);
    const identityField = entity?.identity?.field ?? "id";
    // An entity whose only editable fields are DateTime has no autofocus target at all (G2 made
    // DateTime read-only) — skip rather than assert a property that was never meant to be set.
    const hasFocusable = entity ? !!firstAutofocusableField(entity, identityField) : false;
    if (!hasFocusable) return null;
    return `  testWidgets('${t.entity}: create form autofocuses its first field', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/${kebab(t.entity)}/new');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.autofocus, isTrue, reason: 'create form should autofocus its first field (RCA-005)');
  });`;
  }).filter((c): c is string => !!c);
  if (!cases.length) return null;

  // Each case independently boots the real app (setupDependencies() registers everything in
  // get_it's global singleton) — with more than one case in this file, the second call would
  // throw "already registered" unless the container is torn down between tests.
  const getItReset = sm === "bloc" ? `  setUp(() => GetIt.instance.reset());\n\n` : "";
  const getItImport = sm === "bloc" ? `import 'package:get_it/get_it.dart';\n` : "";

  return `// [generated] generator=FocusTestGenerator template=focus_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
${getItImport}import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
${diImport}
void main() {
${getItReset}${cases.join("\n\n")}
}
`;
}

/**
 * ScrollTestGenerator — structural, deterministic, 0% LLM (Bug B regression guard).
 * For every list screen, seeds N=15 distinguishable rows (sampling.ts's variantSampleArgs — the
 * same deterministic per-row literals the state generator's own demo data uses) directly into a
 * screen-scoped state container, bypassing DI/persistence entirely so this test never depends on
 * (or is broken by) an app's specific persistence backend. Drags the list and asserts the last row
 * becomes reachable — this is the drag-based reproduction the RCA (see docs/qa/tasks/rca/) used to
 * verify scrolling actually works; a future change that breaks the Column/Expanded/ListView.builder
 * shape (unbounded height, NeverScrollableScrollPhysics, ShrinkWrap, ...) will fail this test.
 */
// A minimal single-route GoRouter, not a bare MaterialApp(home: ...) — a CHILD list screen (one
// with a `<Parent>Id` sibling entity elsewhere, e.g. FollowUpListScreen under Task) calls
// `GoRouterState.of(context)` internally (screen.ts's listFilterExpr), which throws "no
// GoRouterState above the current context" under a router-less MaterialApp. Wrapping every list
// screen this way — not just child ones — avoids re-deriving screen.ts's own "is this a child
// list" detection a third time; a non-child screen simply never calls GoRouterState.of, so the
// router wrapper is inert for it.
function routerConfigFor(screenName: string): string {
  return `GoRouter(initialLocation: '/', routes: [GoRoute(path: '/', builder: (_, __) => const ${screenName}())])`;
}

export function generateScrollTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string | null {
  const listScreens = (feature.screens ?? []).filter((s) => s.type === "list");
  if (!listScreens.length) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const N = 15;

  const seedRows = (entity: NonNullable<ReturnType<typeof entityFor>>, indent: string) =>
    Array.from({ length: N }, (_, i) => `${indent}${entity.name}(${variantSampleArgs(entity, feature.enums ?? [], feature.valueObjects ?? [], i + 1)}),`).join("\n");

  function entityFor(entityName: string) {
    return feature.entities.find((e) => e.name === entityName);
  }

  const cases = listScreens.map((s) => {
    const entity = entityFor(s.entity);
    const stateModel = (feature.states ?? []).find((st) => st.name === s.state);
    if (!entity || !stateModel) return null;
    const identityField = entity.identity?.field ?? "id";
    const collection = collectionField(s.entity);
    const statusEnum = `${s.state}Status`;
    const lastKey = `${kebab(s.entity)}-${N}`;

    if (sm === "riverpod") {
      // Riverpod's Notifier.build() is synchronous and self-contained (see state.ts) — overriding
      // it needs no repository/use-case faking at all, unlike bloc's Cubit below.
      return {
        decl: `class _Seeded${s.state}Notifier extends ${s.state}Notifier {
  @override
  ${s.state}State build() => ${s.state}State(
    status: ${statusEnum}.success,
    ${collection}: [
${seedRows(entity, "      ")}
    ],
  );
}`,
        test: `  testWidgets('${s.name}: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(ProviderScope(
      overrides: [${camelize(s.state)}Provider.overrideWith(() => _Seeded${s.state}Notifier())],
      child: MaterialApp.router(theme: buildTheme(), routerConfig: ${routerConfigFor(s.name)}),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('${lastKey}')), findsNothing, reason: 'row ${N} should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('${lastKey}')), findsOneWidget, reason: 'row ${N} should be reachable after dragging up');
  });`,
      };
    }

    // Bloc: the Cubit's constructor requires its list use case (state.ts). We never call it
    // (load() is overridden below), so a `noSuchMethod`-only fake satisfies the repository type
    // without needing to know its actual method signatures — works for any entity/repo shape.
    const repo = findRepoForEntity(feature.repositories, s.entity);
    const listUseCase = (feature.useCases ?? []).find((u) => u.returnType === `List<${s.entity}>`);
    if (!repo || !listUseCase) return null;
    return {
      decl: `class _NoOp${repo.name} implements ${repo.name} {
  @override
  dynamic noSuchMethod(Invocation invocation) => super.noSuchMethod(invocation);
}

class _Seeded${s.state}Cubit extends ${s.state}Cubit {
  _Seeded${s.state}Cubit() : super(${listUseCase.name}(_NoOp${repo.name}()));

  @override
  Future<void> load() async {
    emit(state.copyWith(
      status: ${statusEnum}.success,
      ${collection}: [
${seedRows(entity, "        ")}
      ],
    ));
  }
}`,
      test: `  testWidgets('${s.name}: scrolls when content overflows', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
    await tester.pumpWidget(BlocProvider<${s.state}Cubit>(
      create: (_) => _Seeded${s.state}Cubit()..load(),
      child: MaterialApp.router(theme: buildTheme(), routerConfig: ${routerConfigFor(s.name)}),
    ));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('${lastKey}')), findsNothing, reason: 'row ${N} should be off-screen before scrolling');
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    expect(find.byKey(const ValueKey('${lastKey}')), findsOneWidget, reason: 'row ${N} should be reachable after dragging up');
  });`,
    };
  }).filter((c): c is { decl: string; test: string } => !!c);
  if (!cases.length) return null;

  const libImport = sm === "riverpod"
    ? `import 'package:flutter_riverpod/flutter_riverpod.dart';`
    : `import 'package:flutter_bloc/flutter_bloc.dart';`;

  return `// [generated] generator=ScrollTestGenerator template=scroll_test_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
${libImport}
import 'package:${pkg}/generated.dart';
import 'package:${pkg}/core/theme.dart';

${cases.map((c) => c.decl).join("\n\n")}

void main() {
${cases.map((c) => c.test).join("\n\n")}
}
`;
}

/**
 * BackTestGenerator — structural, deterministic, 0% LLM (G3 regression guard).
 * Every navigation that ARRIVES at a detail/edit/create screen or a parent-linked child list now
 * uses `context.push` (screen.ts), which is what gives go_router's AppBar its automatic back
 * chevron — see G3's `context.push` change. This test proves the resulting back stack actually
 * works, for two shapes:
 *   (1) a list→detail pair: push the entity's own list, then its detail (the SAME two-hop shape a
 *       real row tap produces), tap the back button, assert the list screen reappears.
 *   (2) a parent→child-list pair (childLinks — the same FK convention screen.ts's own
 *       parent→children nav rows use): push the parent's detail, then the child's list, tap back,
 *       assert the parent's detail reappears.
 * `appRouter.push(...)` drives navigation directly (not tapping through the real UI) — the exact
 * same reasoning as generateFocusTest: it works uniformly regardless of which entity is the app's
 * home screen, instead of assuming a specific navigation-graph topology. The detail screen's own
 * `orElse: () => state.<collection>.first` fallback (screen.ts) means a made-up id ('x') still
 * renders real seeded data, so no real record id is needed here.
 */
export function generateBackTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string | null {
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const setup = sm === "bloc" ? "    setupDependencies();\n" : "";
  const diImport = sm === "bloc" ? `import 'package:${pkg}/core/di.dart';\n` : "";

  const cases: string[] = [];
  const screens = feature.screens ?? [];

  // (1) detail screens: push list -> push detail -> back -> list screen reappears.
  for (const s of screens) {
    if (s.type !== "detail") continue;
    const listScreen = screens.find((ls) => ls.entity === s.entity && ls.type === "list");
    if (!listScreen) continue;
    cases.push(`  testWidgets('${s.entity}: detail screen back button returns to the list', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/${kebab(s.entity)}');
    await tester.pumpAndSettle();
    appRouter.push('/${kebab(s.entity)}/x');
    await tester.pumpAndSettle();
    expect(find.byType(${s.name}), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(${listScreen.name}), findsOneWidget);
  });`);
  }

  // (2) child list reached via a parent's detail link: push parent detail -> push child list ->
  // back -> parent detail reappears.
  for (const entity of feature.entities) {
    const parentDetail = screens.find((s) => s.entity === entity.name && s.type === "detail");
    if (!parentDetail) continue;
    for (const c of childLinks(entity.name, feature.entities)) {
      const childListScreen = screens.find((s) => s.entity === c.child && s.type === "list");
      if (!childListScreen) continue;
      cases.push(`  testWidgets('${c.child}: child list (via ${entity.name}) back button returns to parent detail', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/${kebab(entity.name)}/x');
    await tester.pumpAndSettle();
    expect(find.byType(${parentDetail.name}), findsOneWidget);
    appRouter.push('/${kebab(c.child)}?${c.fkField}=x');
    await tester.pumpAndSettle();
    expect(find.byType(${childListScreen.name}), findsOneWidget);
    await tester.tap(find.byType(BackButton));
    await tester.pumpAndSettle();
    expect(find.byType(${parentDetail.name}), findsOneWidget);
  });`);
    }
  }

  if (!cases.length) return null;

  // Each case independently boots the real app (setupDependencies() registers everything in
  // get_it's global singleton) — same reset needed as generateFocusTest whenever this file has
  // more than one case.
  const getItReset = sm === "bloc" ? `  setUp(() => GetIt.instance.reset());\n\n` : "";
  const getItImport = sm === "bloc" ? `import 'package:get_it/get_it.dart';\n` : "";

  return `// [generated] generator=BackTestGenerator template=back_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
${getItImport}import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
import 'package:${pkg}/generated.dart';
${diImport}
void main() {
${getItReset}${cases.join("\n\n")}
}
`;
}
