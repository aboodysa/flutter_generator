import { FeatureModel, Field, RuleModel, StateManagementProvider } from "../types";
import { crudFormTargets, isMoneyField, firstCrudTextField, firstFocusBypassField, findRepoForEntity, policyRulesForEntity, splitGroupFor, hasSplitGroups, hasAuth, hasAttachments, authPersonas, authBootstrapStatement, isTargetReachable, resolveBudget, hasAudit, hasExport, resolvedExportScreens, crudOperations, hasLocale, hasOutbox, fieldRole, quickDecisionTargets } from "../operations";
import { kebab, collectionField, camelize, fieldLabel, fileName, capitalize } from "../naming";
import { variantSampleArgs } from "../sampling";
import { childLinks } from "./screen";
import { actionsTargets, statePlacementFor, searchTargets } from "../composition";
import { nullable } from "../nullability";
import { OracleFile } from "../oracle";
import { GenContext } from "../gen_context";
import { screenPath } from "../routing";

// MF2: shared auth-aware test plumbing. The router boots to /login when unauthenticated (route.ts's
// guardPath), so the app-boot regression tests MUST sign in before pumping the real ReplicaApp.
// `authSession` is the non-empty `Session.instance.signIn(...)` line for the FIRST persona (the
// role whose home/auth.allow area the evidence samples shape to cover these tests' routes), or ""
// for non-auth apps so their output stays byte-identical. The `core/session.dart` IMPORT is
// emitted only when the caller does NOT import `generated.dart` (which re-exports
// `core/session.dart` + `core/auth_login_screen.dart`): flow/crud-flow/focus/scroll tests use the
// direct import, back_test (which always imports generated.dart) passes `sessionViaBarrel=true`
// so it does not emit a redundant import.
export function authSession(feature: FeatureModel, pkg: string, indent: string, sessionViaBarrel = false): { import: string; boot: string } {
  if (!hasAuth(feature)) return { import: "", boot: "" };
  return {
    import: sessionViaBarrel ? "" : `import 'package:${pkg}/core/session.dart';\n`,
    boot: authBootstrapStatement(feature, indent),
  };
}

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

  // Every optional-and-nullable field gets an explicit `null` entry — not just omitted from the
  // JSON — so the round-trip test deliberately exercises each field type's null-handling path in
  // Model.fromJson (caught a real bug: the enum case in model.ts's readExpr didn't null-check,
  // unlike every other type, so a nullable enum field crashed instead of yielding null).
  const jsonEntries = entity.fields
    .filter((f) => f.required)
    .map((f) => `        '${f.name}': ${jsonSample(f)},`)
    .concat(
      entity.fields
        .filter((f) => !f.required && nullable(f))
        .map((f) => `        '${f.name}': null,`)
    )
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

  // D1 (O1.3): dark goldens are emitted ONLY when the IR opts in via attributes.themeMode ==
  // "dark" — existing light goldens must not churn. The dark case forces ThemeMode.dark (the test
  // harness's own brightness is light), renders through buildThemeDark(), and writes a second
  // golden <name>_dark.png. Absent/light/system → no dark case → byte-identical to pre-D1 goldens.
  const dark = feature.attributes?.themeMode === "dark";
  const darkPumpWidget = sm === "riverpod"
    ? `    await tester.pumpWidget(ProviderScope(
      child: MaterialApp(
        theme: buildTheme(),
        darkTheme: buildThemeDark(),
        themeMode: ThemeMode.dark,
        home: ${screen.name}(),
      ),
    ));`
    : `    await tester.pumpWidget(BlocProvider<${screen.state}Cubit>(
      create: (_) => sl<${screen.state}Cubit>()..load(),
      child: MaterialApp(
        theme: buildTheme(),
        darkTheme: buildThemeDark(),
        themeMode: ThemeMode.dark,
        home: ${screen.name}(),
      ),
    ));`;
  const darkCase = dark ? `

  testWidgets('${screen.name} renders (golden dark)', (tester) async {
${setupDi}
${surface}
${darkPumpWidget}
    await tester.pumpAndSettle();
    await expectLater(find.byType(${screen.name}), matchesGoldenFile('goldens/${goldenName}_dark.png'));
  });` : "";

  // P5/D2 Slice 3 (SPIKE_P5_D2_REPORT.md brief §DoD 5): one empty-with-CTA golden case, gated on
  // the SAME statePlacementFor selector screen.ts's own render consumes (recomputed here — the
  // same posture actionsTargets(feature) above already takes for this file, since test.ts's
  // generated artifacts are independent of screen.ts's single render pass). No seeding/mocking
  // needed: the Cubit's own default constructor (`const ${screen.state}State()`, state.ts) IS the
  // empty-collection/non-loading/non-error case — just skip load(). Bloc-only this iteration, same
  // documented gap this file's search/export goldens already carry (no current sample pairs
  // riverpod with a create-capable list).
  const emptyPlacement = statePlacementFor(screen, feature);
  const emptyCtaCase = emptyPlacement?.emptyCta && sm !== "riverpod" ? `

  testWidgets('${screen.name} renders empty with CTA (golden)', (tester) async {
${setupDi}
${surface}
    await tester.pumpWidget(BlocProvider<${screen.state}Cubit>(
      create: (_) => sl<${screen.state}Cubit>(),
      child: MaterialApp(theme: buildTheme(), home: ${screen.name}()),
    ));
    await tester.pumpAndSettle();
    await expectLater(find.byType(${screen.name}), matchesGoldenFile('goldens/${goldenName}_empty.png'));
  });` : "";

  // Each case independently calls setupDependencies() (get_it's global singleton) — with more
  // than one case in this file, the second call throws "already registered" unless the container
  // is torn down between tests (same fix generateFocusTest/generateScrollTest already carry).
  const multiCase = sm === "bloc" && (!!darkCase || !!emptyCtaCase);
  const getItReset = multiCase ? `  setUp(() => GetIt.instance.reset());\n\n` : "";
  const getItImport = multiCase ? `import 'package:get_it/get_it.dart';\n` : "";

  return `// [generated] generator=GoldenTestGenerator template=golden_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
${getItImport}${libImport}
${diImport}import 'package:${pkg}/generated.dart';
import 'package:${pkg}/core/theme.dart';
import 'package:flutter/material.dart';

void main() {
${fontLoader}

${getItReset}  testWidgets('${screen.name} renders (golden)', (tester) async {
${setupDi}
${surface}
${pumpWidget}
    await tester.pumpAndSettle();
    await expectLater(find.byType(${screen.name}), matchesGoldenFile('goldens/${goldenName}.png'));
  });
${darkCase}${emptyCtaCase}
}
`;
}

/**
 * L10nTestGenerator — structural, deterministic, 0% LLM (L4).
 * Emitted only when hasLocale(feature). Two independent proofs:
 *  1. AppStrings.of(context) actually swaps per locale (a synthetic Builder — reliable and
 *     entity-agnostic, doesn't depend on any real screen showing translated chrome text visibly).
 *  2. The app's first real screen (same "screens[0] is the app's testable identity" convention
 *     generateGoldenTest/generateMain already use) flips Directionality per locale, throws no
 *     exception under RTL (proves no overflow — Flutter's test binding surfaces a RenderFlex
 *     overflow as a caught FlutterError, which tester.takeException() would return non-null),
 *     and captures both an EN (LTR) and AR (RTL) golden.
 */
export function generateL10nTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string | null {
  if (!hasLocale(feature)) return null;
  const screen = feature.screens?.[0];
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

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

  const localizationsBlock = `      supportedLocales: const [Locale('en'), Locale('ar')],
      localizationsDelegates: const [
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],`;

  const swapTest = `  testWidgets('AppStrings.of swaps strings per locale', (tester) async {
    Widget wrap(Locale locale) => MaterialApp(
      locale: locale,
${localizationsBlock}
      home: Builder(builder: (context) => Text(AppStrings.of(context).save)),
    );

    await tester.pumpWidget(wrap(const Locale('en')));
    await tester.pumpAndSettle();
    expect(find.text('Save'), findsOneWidget);

    await tester.pumpWidget(wrap(const Locale('ar')));
    await tester.pumpAndSettle();
    expect(find.text('حفظ'), findsOneWidget);
  });`;

  if (!screen) {
    return `// [generated] generator=L10nTestGenerator template=l10n.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:${pkg}/core/app_strings.dart';

void main() {
${fontLoader}

${swapTest}
}
`;
  }

  const goldenName = screen.name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  const wrapScreen = (localeExpr: string) =>
    sm === "riverpod"
      ? `ProviderScope(child: MaterialApp(\n        locale: ${localeExpr},\n${localizationsBlock}\n        theme: buildTheme(),\n        home: ${screen.name}(),\n      ))`
      : `BlocProvider<${screen.state}Cubit>(\n        create: (_) => sl<${screen.state}Cubit>()..load(),\n        child: MaterialApp(\n          locale: ${localeExpr},\n${localizationsBlock}\n          theme: buildTheme(),\n          home: ${screen.name}(),\n        ),\n      )`;
  const libImport = sm === "riverpod"
    ? `import 'package:flutter_riverpod/flutter_riverpod.dart';`
    : `import 'package:flutter_bloc/flutter_bloc.dart';`;
  const diImport = sm === "riverpod" ? "" : `import 'package:${pkg}/core/di.dart';`;
  const setupDi = sm === "riverpod" ? "" : `    setupDependencies();`;

  const rtlTest = `  testWidgets('${screen.name} flips Directionality per locale, no RTL overflow, AR+EN goldens', (tester) async {
${setupDi}
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    await tester.pumpWidget(${wrapScreen("const Locale('en')")});
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow or other error under EN/LTR');
    expect(Directionality.of(tester.element(find.byType(${screen.name}))), TextDirection.ltr);
    await expectLater(find.byType(${screen.name}), matchesGoldenFile('goldens/l10n_en.png'));

    await tester.pumpWidget(${wrapScreen("const Locale('ar')")});
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow or other error under AR/RTL');
    expect(Directionality.of(tester.element(find.byType(${screen.name}))), TextDirection.rtl);
    await expectLater(find.byType(${screen.name}), matchesGoldenFile('goldens/l10n_ar.png'));
  });`;

  // G-L4-2: the login screen is the one screen every locale-aware auth app boots to before
  // anything else, and it's a StatelessWidget with no Cubit/Provider dependency (unlike
  // wrapScreen's targets above) — a minimal MaterialApp wrap is enough, no setupDependencies().
  const loginRtlTest = hasAuth(feature)
    ? `
  testWidgets('AuthLoginScreen flips Directionality per locale, no RTL overflow, AR+EN goldens', (tester) async {
    tester.view.physicalSize = const Size(390, 844);
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);

    Widget wrapLogin(Locale locale) => MaterialApp(
      locale: locale,
${localizationsBlock}
      theme: buildTheme(),
      home: const AuthLoginScreen(),
    );

    await tester.pumpWidget(wrapLogin(const Locale('en')));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow or other error under EN/LTR');
    expect(find.text('Sign in'), findsOneWidget);
    expect(Directionality.of(tester.element(find.byType(AuthLoginScreen))), TextDirection.ltr);
    await expectLater(find.byType(AuthLoginScreen), matchesGoldenFile('goldens/l10n_login_en.png'));

    await tester.pumpWidget(wrapLogin(const Locale('ar')));
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: 'no RenderFlex overflow or other error under AR/RTL');
    expect(find.text('تسجيل الدخول'), findsOneWidget);
    expect(Directionality.of(tester.element(find.byType(AuthLoginScreen))), TextDirection.rtl);
    await expectLater(find.byType(AuthLoginScreen), matchesGoldenFile('goldens/l10n_login_ar.png'));
  });`
    : "";

  return `// [generated] generator=L10nTestGenerator template=l10n_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/services.dart';
${libImport}
${diImport}import 'package:${pkg}/generated.dart';
import 'package:${pkg}/core/theme.dart';
import 'package:${pkg}/core/app_strings.dart';
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';

void main() {
${fontLoader}

${swapTest}

${rtlTest}
${loginRtlTest}
}
`;
}

/**
 * FlowTestGenerator — structural, deterministic, 0% LLM.
 * Emits a widget-level integration flow test (pump the whole app, verify the screen renders).
 */
export function generateFlowTest(feature: FeatureModel): string {
  const screens = feature.screens ?? [];
  // This test taps the FIRST ListTile on whatever screen `ReplicaApp()` boots to (`screens[0]`,
  // the same convention route.ts's initialLocation uses) — so the detail screen it asserts landing
  // on must belong to THAT SAME entity, not just be "the first detail screen declared anywhere."
  // Before this fix, an app whose home entity has no detail screen but SOME other entity does
  // (e.g. work_auth's WorkAuth-home + a later-added VisaQuota detail) would generate a tap
  // assertion for an unreachable screen — every existing sample's first detail screen already
  // belongs to its own boot entity (or no detail screen exists at all), so this is a no-op for them.
  const bootEntity = screens[0]?.entity;
  const detail = screens.find((s) => s.type === "detail" && s.entity === bootEntity);
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

  const generatedImport = detail ? `import 'package:${pkg}/generated.dart';` : "";
  const session = authSession(feature, pkg, "    ");
  // MF2: don't assert the list→detail nav when the first persona is deliberately denied the
  // detail entity's area — per-role denial is auth_test.dart's job, not this boot test's.
  const navDefined = !!detail && isTargetReachable(feature, detail.entity);
  const nav = navDefined
    ? `    await tester.tap(find.byType(ListTile).first);
    await tester.pumpAndSettle();
    expect(find.byType(${detail!.name}), findsOneWidget);`
    : "";

  return `// [generated] generator=FlowTestGenerator template=flow.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/di.dart';
import 'package:flutter/material.dart';
${generatedImport}
${session.import}
void main() {
  testWidgets('app boots and navigates', (tester) async {
    setupDependencies();
${session.boot}    await tester.pumpWidget(const ReplicaApp());
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
  // This test taps the create FAB directly on whatever screen `ReplicaApp()` boots to
  // (`screens[0]`, same convention as route.ts's initialLocation) — so the target entity must be
  // the BOOT entity itself, not just any full-CRUD entity with a detail screen somewhere in the
  // app. Before this fix, an app whose boot entity lacks full CRUD but SOME other entity has it
  // (e.g. work_auth's WorkAuth-home + a later-added full-CRUD VisaQuota) would generate a flow
  // that taps "add" on the wrong screen — every existing sample's qualifying target already IS its
  // boot entity (or none qualifies), so this is a no-op for them.
  const bootEntity = (feature.screens ?? [])[0]?.entity;
  const target = [...crudFormTargets(feature).values()].find(
    (t) => t.entity === bootEntity && t.delete && (feature.screens ?? []).some((s) => s.entity === t.entity && s.type === "detail"),
  );
  // MF2: skip the whole CRUD flow when the first persona is denied the target's area (denial is
  // asserted by auth_test, not this boot test) — e.g. an employee persona whose role's home is
  // leave-requests while the only full-CRUD target lives in the admin area.
  if (!target || !isTargetReachable(feature, target.entity)) return null;

  const entity = feature.entities.find((e) => e.name === target.entity);
  const identityField = entity?.identity?.field ?? "id";
  const firstField = entity ? firstCrudTextField(entity, identityField) : undefined;
  const money = !!firstField && isMoneyField(firstField);
  const currency = firstField?.currency ?? "SAR";

  const createValue = money ? "1250.50" : "Widget test value";
  const updateValue = money ? "1999.25" : "Widget test value updated";
  const createExpect = money ? `1,250.50 ${currency}` : createValue;
  const updateExpect = money ? `1,999.25 ${currency}` : updateValue;

  // P4 (contract §6): consume the DECIDED delete presentation (composition.ts's actionsTargets —
  // the SAME selector index.ts uses, never re-derived) so the flow test either taps the inline
  // Delete icon then the confirm dialog, or — when actionsFor overflowed Delete into the "…" menu
  // (a >2-action detail like hr_service's audited LeaveRequest) — opens the overflow menu first.
  let deleteViaOverflow = false;
  const detailScreen = (feature.screens ?? []).find((s) => s.entity === target.entity && s.type === "detail");
  if (detailScreen) {
    const specs = actionsTargets(feature).get(detailScreen.name) ?? [];
    deleteViaOverflow = specs.some((a) => a.kind === "delete" && a.presentation === "overflow");
  }

  // D1: crud_form.ts renders a status/priority enum as a ChoiceChip row (see crud_form.ts's
  // "UIX Slice D" comment) instead of a Dropdown — this test only ever typed into the first
  // TextField, so onSelected was proven by render+analyze, never by an actual tap. The form's
  // default selection is always `${enumType}.values.first`, so tapping the SECOND value (when one
  // exists) and asserting selected flips true/false there/on the default is a real behavioral
  // check, not just a render check.
  const roleCtx = { identityField, entityNames: (feature.entities ?? []).map((e) => e.name) };
  const chipField = entity?.fields.find((f) => f.type === "enum" && ["status", "priority"].includes(fieldRole(f, roleCtx)));
  const chipEnumValues = chipField ? (feature.enums ?? []).find((e) => e.name === (chipField.of || capitalize(chipField.name)))?.values : undefined;
  const chipTapStep = chipField && chipEnumValues && chipEnumValues.length >= 2
    ? `    await tester.tap(find.widgetWithText(ChoiceChip, '${chipEnumValues[1]}'));
    await tester.pumpAndSettle();
    expect(tester.widget<ChoiceChip>(find.widgetWithText(ChoiceChip, '${chipEnumValues[1]}')).selected, isTrue, reason: 'tapping a chip must select it (onSelected wiring)');
    expect(tester.widget<ChoiceChip>(find.widgetWithText(ChoiceChip, '${chipEnumValues[0]}')).selected, isFalse, reason: 'selecting a new chip must deselect the previous one');
`
    : "";

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const session = authSession(feature, pkg, "    ");
  const setup = sm === "bloc" ? `    setupDependencies();\n${session.boot}` : "";
  const diImport = sm === "bloc" ? `import 'package:${pkg}/core/di.dart';\n` : "";

  return `// [generated] generator=CrudFlowTestGenerator template=crud_flow_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:${pkg}/main.dart';
${diImport}
${session.import}
void main() {
  testWidgets('${target.entity}: create -> edit -> delete', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();

    // create (list FAB -> form -> submit -> lands on detail)
    await tester.tap(find.byIcon(Icons.add));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, '${createValue}');
${chipTapStep}    await tester.tap(find.text('Create'));
    await tester.pumpAndSettle();
    expect(find.text('${createExpect}'), findsOneWidget);

    // edit (detail AppBar action -> form, prefilled -> submit -> back on detail)
    await tester.tap(find.byIcon(Icons.edit));
    await tester.pumpAndSettle();
    await tester.enterText(find.byType(TextField).first, '${updateValue}');
    await tester.tap(find.text('Save'));
    await tester.pumpAndSettle();
    expect(find.text('${updateExpect}'), findsOneWidget);

    // delete (detail action -> P4 confirm dialog -> confirm -> back on the list, row gone).
    // When actionsFor overflowed Delete into the "…" menu (a >2-action detail), open the overflow
    // menu and pick Delete first; otherwise Delete is an inline AppBar icon. Then the confirm
    // dialog appears either way.
    ${deleteViaOverflow
      ? `    await tester.tap(find.byIcon(Icons.more_vert));
    await tester.pumpAndSettle();
    await tester.tap(find.text('Delete'));
    await tester.pumpAndSettle();`
      : `    await tester.tap(find.byIcon(Icons.delete));
    await tester.pumpAndSettle();`}
    expect(find.text('Delete ${target.entity}?'), findsOneWidget); // P4 confirm dialog present
    await tester.tap(find.widgetWithText(FilledButton, 'Delete'));
    await tester.pumpAndSettle();
    expect(find.text('${updateExpect}'), findsNothing);
  });
}
`;
}

/**
 * FocusTestGenerator — structural, deterministic, 0% LLM (RCA-005 / Bug A regression guard,
 * updated for the keyboard-bypass follow-up — the owner still saw no keyboard on a real iOS
 * device with autofocus alone, so the fix is now a gesture-bound `FocusNode.requestFocus()`
 * wired to the first field's `onTap`, not `autofocus`; see crud_form.ts's own doc comment for
 * the full RCA).
 * For every entity with a synthesized CRUD form, drives the real app straight to that entity's
 * create AND edit routes via `appRouter.go(...)` (bypassing UI navigation — a route can be
 * several hops deep, e.g. a child entity reached only through a parent's detail screen, so
 * tapping through would make this test's shape depend on each app's specific navigation graph;
 * the edit route's `orElse: () => state.<collection>.first` fallback — see screen.ts's detail
 * body — means a made-up id still renders a real, fully-wired form). Asserts the bypass target
 * field (operations.ts's firstFocusBypassField — the SAME field crud_form.ts itself wires)
 * carries a non-null `focusNode`/`onTap` (the structural check: a generator that reverted to bare
 * `autofocus` or dropped the bypass entirely has neither), AND that tapping it genuinely
 * transitions the FocusNode to focused (the behavioral check — proves the wiring actually works,
 * not just exists).
 */
export function generateFocusTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string | null {
  // MF2: only exercise targets the first persona can actually reach — a boot test navigates the
  // real guarded router, so a denied area would redirect away from the form it wants to drive.
  const targets = [...crudFormTargets(feature).values()].filter((t) => isTargetReachable(feature, t.entity));
  if (!targets.length) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const session = authSession(feature, pkg, "    ");
  const setup = sm === "bloc" ? `    setupDependencies();\n${session.boot}` : "";
  const diImport = sm === "bloc" ? `import 'package:${pkg}/core/di.dart';\n` : "";

  const focusCase = (entityName: string, route: string, label: string) => `  testWidgets('${entityName}: ${label} form wires a focus-bypass FocusNode on its first field', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('${route}');
    await tester.pumpAndSettle();
    final field = tester.widget<TextField>(find.byType(TextField).first);
    expect(field.focusNode, isNotNull, reason: 'first field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(field.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(TextField).first);
    await tester.pump();
    expect(field.focusNode!.hasFocus, isTrue, reason: 'tapping the field must actually transition it to focused');
  });`;

  const cases = targets.flatMap((t) => {
    const entity = feature.entities.find((e) => e.name === t.entity);
    const identityField = entity?.identity?.field ?? "id";
    // An entity whose only editable fields are DateTime has no bypass target at all (G2 made
    // DateTime read-only) — skip rather than assert a property that was never meant to be set.
    const hasFocusable = entity ? !!firstFocusBypassField(entity, identityField) : false;
    if (!hasFocusable) return [];
    const base = `/${kebab(t.entity)}`;
    return [
      focusCase(t.entity, `${base}/new`, "create"),
      focusCase(t.entity, `${base}/x/edit`, "edit"),
    ];
  });
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
${session.import}
void main() {
${getItReset}${cases.join("\n\n")}
}
`;
}

/**
 * SearchFocusTestGenerator — structural, deterministic, 0% LLM (RCA-002 regression guard, mirrors
 * generateFocusTest above verbatim in shape). The owner's iPhone Safari report ("i can not type
 * search term") traced to the SearchBar emits (list AND sections archetype) never carrying the
 * gesture-bound FocusNode bypass crud_form.ts:88-110 already wires for form fields — see this
 * file's screen.ts sibling for the actual fix. For every screen composition.ts's searchTargets
 * resolved a SearchSpec for, navigates straight to that screen via `appRouter.go(screenPath(...))`
 * (same route-by-path navigation generateViewportSqueezeTest already uses — works uniformly for
 * both list and sections screens, no per-archetype branching needed) and asserts the rendered
 * SearchBar carries a non-null `focusNode`/`onTap` (the structural check — a generator that
 * dropped the bypass has neither) AND that tapping it genuinely transitions the FocusNode to
 * focused (the behavioral check — proves the wiring actually works). Bloc-only, same as the fix
 * itself: screen.ts's `searchEnabled` is `!!searchSpec && sm !== "riverpod"` (no current sample
 * pairs riverpod with a searchable screen), so this generator is a no-op for a riverpod app rather
 * than asserting a bypass the screen generator never emits for it.
 */
export function generateSearchFocusTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string | null {
  if (sm === "riverpod") return null;
  const screens = feature.screens ?? [];
  const targets = searchTargets(feature); // Map<screenName, SearchSpec>
  const searchable = screens.filter((s) => targets.has(s.name) && isTargetReachable(feature, s.entity));
  if (!searchable.length) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const session = authSession(feature, pkg, "    ");
  const setup = `    setupDependencies();\n${session.boot}`;
  const diImport = `import 'package:${pkg}/core/di.dart';\n`;

  const cases = searchable.map((s) => {
    const route = screenPath(screens, s).replace(":id", "x");
    return `  testWidgets('${s.name}: search bar wires a focus-bypass FocusNode (iOS Safari keyboard fix)', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('${route}');
    await tester.pumpAndSettle();
    final bar = tester.widget<SearchBar>(find.byType(SearchBar));
    expect(bar.focusNode, isNotNull, reason: 'search field needs an explicit FocusNode for the gesture-bound requestFocus bypass (iOS Safari keyboard fix)');
    expect(bar.onTap, isNotNull, reason: 'onTap must call requestFocus() synchronously inside the tap gesture');
    await tester.tap(find.byType(SearchBar));
    await tester.pump();
    expect(bar.focusNode!.hasFocus, isTrue, reason: 'tapping the search bar must actually transition it to focused');
  });`;
  });

  // Each case independently boots the real app (setupDependencies() registers everything in
  // get_it's global singleton) — same reset generateFocusTest/generateScrollTest/
  // generateViewportSqueezeTest already need whenever this file has more than one case.
  const getItReset = "  setUp(() => GetIt.instance.reset());\n\n";
  const getItImport = "import 'package:get_it/get_it.dart';\n";

  return `// [generated] generator=SearchFocusTestGenerator template=search_focus_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
${getItImport}import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
${diImport}
${session.import}
void main() {
${getItReset}${cases.join("\n\n")}
}
`;
}

/**
 * ViewportSqueezeTestGenerator — structural, deterministic, 0% LLM (D2#2, SPIKE_S6_REPORT.md
 * §14.4.3 / DESIGN.md §14.4.3). Renders EVERY declared screen at three fixed viewports — 320×480
 * (small phone), 390×844 (iPhone-class, the goldens' own size), 1400×900 (desktop) — and asserts
 * `tester.takeException()` is null: no RenderFlex overflow or other layout exception at any size.
 * Run unconditionally across every screen (DESIGN.md §14.4.3: "the 11 real overflows were all on
 * low-attention admin screens — sampling would miss exactly these"). Assertions-only, no
 * `matchesGoldenFile` — wiring this in touches zero existing goldens.
 * Same "pump the real app, appRouter.go(route)" navigation generateFocusTest/generateBackTest
 * already use, reusing `screenPath` (routing.ts) for the route — works uniformly for
 * list/detail/wizard/dashboard screens regardless of app topology, no per-screen state seeding
 * needed. A dynamic `:id` segment gets the same literal 'x' placeholder generateFocusTest/
 * generateBackTest already rely on (the detail/edit screen's own
 * `orElse: () => state.<collection>.first` fallback renders real seeded data for it).
 */
const VIEWPORT_MATRIX: [string, string][] = [
  ["320x480", "Size(320, 480)"],
  ["390x844", "Size(390, 844)"],
  ["1400x900", "Size(1400, 900)"],
];

export function generateViewportSqueezeTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string {
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const screens = feature.screens ?? [];

  if (!screens.length) {
    return `// [generated] generator=ViewportSqueezeTestGenerator template=viewport_squeeze.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';

void main() {
  test('vanilla app has no screens to squeeze-test', () {
    expect(true, isTrue);
  });
}
`;
  }

  const session = authSession(feature, pkg, "    ");
  // Riverpod apps don't register a get_it container (mirrors generateFocusTest/generateGoldenTest's
  // own sm-branch) — `ReplicaApp` itself wires ProviderScope internally either way, so the pump
  // statement below needs no sm-branch, only the DI bootstrap does.
  const setupDi = sm === "riverpod" ? "" : "    setupDependencies();\n";
  const diImport = sm === "riverpod" ? "" : `import 'package:${pkg}/core/di.dart';\n`;

  const cases = screens.flatMap((s) => {
    const route = screenPath(screens, s).replace(":id", "x");
    return VIEWPORT_MATRIX.map(([label, size]) => `  testWidgets('${s.name}: no overflow at ${label}', (tester) async {
    tester.view.physicalSize = const ${size};
    tester.view.devicePixelRatio = 1.0;
    addTearDown(tester.view.reset);
${setupDi}${session.boot}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('${route}');
    await tester.pumpAndSettle();
    expect(tester.takeException(), isNull, reason: '${s.name} must not overflow at ${label}');
  });`);
  });

  // Every case independently calls setupDependencies() (get_it's global singleton) — with more
  // than one case in this file, the second call throws "already registered" unless the container
  // is torn down between tests (same fix generateFocusTest/generateScrollTest already carry).
  const getItReset = sm === "bloc" ? "  setUp(() => GetIt.instance.reset());\n\n" : "";
  const getItImport = sm === "bloc" ? "import 'package:get_it/get_it.dart';\n" : "";

  return `// [generated] generator=ViewportSqueezeTestGenerator template=viewport_squeeze.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
${getItImport}import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
${diImport}${session.import}
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
    // P2: a single fixed-magnitude drag + immediate settle isn't robust once a screen's own
    // content (e.g. a SearchBar above the list — screen.ts's search block) changes how much
    // viewport the list has, which changes how many increments a real drag+fling needs to
    // actually reach the last row. scrollUntilVisible (Flutter's own SDK helper for exactly this)
    // repeats a bounded drag until the target is visible instead of gambling on one big number —
    // the scrollable: arg is required (not the default) because a searchable screen has a SECOND
    // Scrollable (the SearchBar's own text field), and the default finder requires exactly one.
    await tester.scrollUntilVisible(find.byKey(const ValueKey('${lastKey}')), 300.0, scrollable: find.descendant(of: find.byType(ListView), matching: find.byType(Scrollable)));
    expect(find.byKey(const ValueKey('${lastKey}')), findsOneWidget, reason: 'row ${N} should be reachable after scrolling');
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
    // P2: same reasoning as the riverpod branch above — scrollUntilVisible tolerates a
    // searchable screen's shorter list viewport instead of gambling on one fixed-magnitude drag.
    await tester.scrollUntilVisible(find.byKey(const ValueKey('${lastKey}')), 300.0, scrollable: find.descendant(of: find.byType(ListView), matching: find.byType(Scrollable)));
    expect(find.byKey(const ValueKey('${lastKey}')), findsOneWidget, reason: 'row ${N} should be reachable after scrolling');
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
  // back_test always imports generated.dart (which re-exports core/session.dart) → no direct
  // session import, avoiding an unnecessary_import lint.
  const session = authSession(feature, pkg, "    ", true);
  const setup = sm === "bloc" ? `    setupDependencies();\n${session.boot}` : "";
  const diImport = sm === "bloc" ? `import 'package:${pkg}/core/di.dart';\n` : "";

  const cases: string[] = [];
  const screens = feature.screens ?? [];

  // (1) detail screens: push list -> push detail -> back -> list screen reappears.
  for (const s of screens) {
    if (s.type !== "detail") continue;
    // MF2: skip shapes the first persona is denied (the guarded router would redirect, never
    // render the pushed route) — per-role denial is auth_test.dart's concern.
    if (!isTargetReachable(feature, s.entity)) continue;
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
      // MF2: both the parent detail and the child list must be inside the first persona's area.
      if (!isTargetReachable(feature, entity.name) || !isTargetReachable(feature, c.child)) continue;
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
${session.import}
void main() {
${getItReset}${cases.join("\n\n")}
}
`;
}

/**
 * QuickDecisionTestGenerator — structural, deterministic, 0% LLM (LM6 regression guard).
 * For every review-queue entity (operations.ts's quickDecisionTargets — a status-role field +
 * repo update, no detail screen, no full CRUD form: e.g. Approval.decision), taps the first
 * quick-decision action button on the first list row and asserts the tapped-for value actually
 * appears on screen afterward — proves the button's onPressed genuinely calls update() and the
 * Cubit/Notifier re-renders, not just that the button exists (render+analyze alone wouldn't catch
 * a button wired to the wrong method, same class of gap D1 already closed for ChoiceChip taps).
 * Reads the button's OWN advertised target value (its tooltip) rather than hardcoding an
 * entity-specific value name, so this generalizes to any app's review-queue entity.
 */
export function generateQuickDecisionTest(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string | null {
  const targets = [...quickDecisionTargets(feature).values()].filter((t) => isTargetReachable(feature, t.entity));
  if (!targets.length) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const session = authSession(feature, pkg, "    ", true);
  const setup = sm === "bloc" ? `    setupDependencies();\n${session.boot}` : "";
  const diImport = sm === "bloc" ? `import 'package:${pkg}/core/di.dart';\n` : "";

  // Explicit navigation (appRouter.push, same convention back_test.dart/focus_test.dart use for
  // any screen that isn't necessarily the app's boot/home screen) — a review-queue entity's own
  // list is rarely the first persona's home (e.g. ledgerly's employee home is ExpenseClaim, not
  // Approval), so relying on the boot screen would silently test the WRONG list's first row.
  const cases = targets.map((t) => `  testWidgets('${t.entity}: quick decision action flips ${t.field.name}', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.push('/${kebab(t.entity)}');
    await tester.pumpAndSettle();
    // Scoped to ${t.screen.name} specifically — go_router's Navigator stack keeps the previous
    // (pushed-from) route's widgets findable too, and it can carry its own AppListCard rows.
    final screenFinder = find.byType(${t.screen.name});
    final card = find.descendant(of: screenFinder, matching: find.byType(AppListCard)).first;
    final action = find.descendant(of: card, matching: find.byType(IconButton)).first;
    final target = tester.widget<IconButton>(action).tooltip!;
    await tester.tap(action);
    await tester.pumpAndSettle();
    expect(find.descendant(of: screenFinder, matching: find.text(target)), findsWidgets, reason: 'tapping the quick-decision action must flip ${t.field.name} to the tapped value');
  });`);

  const getItReset = sm === "bloc" ? `  setUp(() => GetIt.instance.reset());\n\n` : "";
  const getItImport = sm === "bloc" ? `import 'package:get_it/get_it.dart';\n` : "";

  return `// [generated] generator=QuickDecisionTestGenerator template=quick_decision_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
${getItImport}import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
import 'package:${pkg}/core/components.dart';
import 'package:${pkg}/generated.dart';
${diImport}
${session.import}
void main() {
${getItReset}${cases.join("\n\n")}
}
`;
}

/**
 * PolicyTestGenerator — structural, deterministic, 0% LLM (L2 regression guard).
 * For every entity with >=1 severity'd rule (operations.ts's policyRulesForEntity), drives the
 * create form to trigger each rule's own condition — never a hardcoded field/value, always read
 * off the RuleCondition itself, so this generalizes to any app-type's policy rules, not just the
 * samples this feature happened to add severity to. Only two condition shapes are driveable
 * generically today: an enum field compared with `==` (tap its ChoiceChip) and a numeric/money
 * field compared with `>=`/`>` (type a value safely over the threshold) — a rule whose condition
 * doesn't match either shape is skipped (documented gap, not a silent wrong assertion).
 * Covers exactly what the task asked for: block prevents Save, warn allows Save with a visible
 * message, requireJustification blocks until typed, waive requires a reason (and re-enables Save).
 */
function policyTriggerSteps(rule: RuleModel, entity: { fields: Field[] }): string | null {
  const cond = rule.conditions[0];
  if (!cond) return null;
  const field = entity.fields.find((f) => f.name === cond.field);
  if (!field) return null;
  if (field.type === "enum" && cond.operator === "==") {
    return `    await tester.tap(find.widgetWithText(ChoiceChip, '${cond.value}'));\n    await tester.pumpAndSettle();`;
  }
  const numeric = isMoneyField(field) || field.type === "double" || field.type === "int";
  if (numeric && (cond.operator === ">=" || cond.operator === ">")) {
    const triggerValue = String(Math.ceil(parseFloat(cond.value)) + 1);
    return `    await tester.enterText(find.widgetWithText(TextField, '${fieldLabel(field.name)}'), '${triggerValue}');\n    await tester.pumpAndSettle();`;
  }
  return null;
}

// A trigger value chosen for one rule's threshold can ALSO cross a co-active rule's own threshold
// on the same field (a block rule's amount>=15000 trigger is, by construction, also >=2000) — both
// verdicts become simultaneously active in the real form (crud_form.ts's _policyPanel shows every
// non-autoApprove, non-waived verdict at once). If any of those co-triggered verdicts requires
// justification, Save stays disabled after waiving the block verdict alone; the waive test case
// needs to also satisfy them. Deterministic from the IR alone — same numeric trigger value
// policyTriggerSteps computes, no runtime Dart evaluation needed.
function coTriggeredJustificationRules(rule: RuleModel, allRules: RuleModel[], entity: { fields: Field[] }): RuleModel[] {
  const cond = rule.conditions[0];
  if (!cond) return [];
  const field = entity.fields.find((f) => f.name === cond.field);
  if (!field) return [];
  const numeric = isMoneyField(field) || field.type === "double" || field.type === "int";
  if (!numeric || (cond.operator !== ">=" && cond.operator !== ">")) return [];
  const triggerValue = Math.ceil(parseFloat(cond.value)) + 1;
  return allRules.filter((r) => {
    if (r === rule || r.severity !== "requireJustification") return false;
    const c = r.conditions[0];
    if (!c || c.field !== cond.field) return false;
    if (c.operator !== ">=" && c.operator !== ">") return false;
    return triggerValue >= parseFloat(c.value) + (c.operator === ">" ? 0.01 : 0);
  });
}

export function generatePolicyTest(feature: FeatureModel): string | null {
  const targets = [...crudFormTargets(feature).values()].filter((t) => isTargetReachable(feature, t.entity));
  if (!targets.length) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const session = authSession(feature, pkg, "    ");
  const setup = `    setupDependencies();\n${session.boot}`;

  const cases: string[] = [];
  let waiveCaseWritten = false;

  for (const t of targets) {
    const entity = feature.entities.find((e) => e.name === t.entity);
    if (!entity) continue;
    const rules = policyRulesForEntity(feature, t.entity);
    if (!rules.length) continue;
    const base = `/${kebab(t.entity)}`;

    for (const rule of rules) {
      const trigger = policyTriggerSteps(rule, entity);
      if (!trigger) continue; // undriveable condition shape — documented gap, not asserted

      // Scroll to the bottom of the form after triggering — the policy panel adds Cards above
      // PrimaryButton, and Flutter's ListView only builds elements within the viewport/cache
      // extent, so a form with enough policy content pushes the button (or the Justification /
      // Waive reason fields) out of the built element tree. Mirrors ScrollTestGenerator's own
      // drag-based approach (see generateScrollTest above) rather than inventing a new idiom.
      const scrollToBottom = `    await tester.drag(find.byType(ListView), const Offset(0, -2000));\n    await tester.pumpAndSettle();`;

      if (rule.severity === "block") {
        cases.push(`  testWidgets('${t.entity}: ${rule.name} (block) prevents Save until waived', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('${base}/new');
    await tester.pumpAndSettle();
${trigger}
${scrollToBottom}
    expect(find.textContaining('${(rule.message ?? "").replace(/'/g, "\\'")}'), findsOneWidget, reason: 'the employee must see the verdict message before submit');
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNull, reason: 'a block verdict must prevent Save until waived');
  });`);
        if (!waiveCaseWritten) {
          waiveCaseWritten = true;
          // A trigger value that crosses this rule's threshold can ALSO cross a lower-severity
          // rule's own threshold on the same entity (e.g. a block rule's amount>=X trigger is
          // usually well above a warn rule's amount>=Y, Y<X) — every non-autoApprove, non-waived
          // verdict renders its own "Waive reason"/"Waive" pair (crud_form.ts's _policyPanel), so
          // more than one can be on screen at once. Scope both finders to the ancestor Card that
          // contains THIS rule's own message, not a bare widgetWithText lookup that assumes
          // exactly one "Waive" button exists app-wide.
          const escapedMessage = (rule.message ?? "").replace(/'/g, "\\'");
          const card = `find.ancestor(of: find.textContaining('${escapedMessage}'), matching: find.byType(Card))`;
          // The same trigger value can also cross a co-active requireJustification rule's own
          // threshold (see coTriggeredJustificationRules) — Save would stay disabled after waiving
          // THIS verdict alone unless those are satisfied too.
          const coTriggered = coTriggeredJustificationRules(rule, rules, entity);
          const satisfyOthers = coTriggered.length
            ? `    await tester.enterText(find.widgetWithText(TextField, 'Justification'), 'Approved — see attached memo.');\n    await tester.pumpAndSettle();\n`
            : "";
          cases.push(`  testWidgets('${t.entity}: ${rule.name} waive requires a reason, then re-enables Save', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('${base}/new');
    await tester.pumpAndSettle();
${trigger}
${scrollToBottom}
    expect(tester.widget<TextButton>(find.descendant(of: ${card}, matching: find.widgetWithText(TextButton, 'Waive'))).onPressed, isNull, reason: 'Waive must stay disabled until a reason is typed (mandatory comment)');
    await tester.enterText(find.descendant(of: ${card}, matching: find.widgetWithText(TextField, 'Waive reason')), 'Reviewed and approved offline.');
    await tester.pumpAndSettle();
    await tester.tap(find.descendant(of: ${card}, matching: find.widgetWithText(TextButton, 'Waive')));
    await tester.pumpAndSettle();
${satisfyOthers}    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a waived verdict must no longer prevent Save');
  });`);
        }
      } else if (rule.severity === "warn") {
        cases.push(`  testWidgets('${t.entity}: ${rule.name} (warn) shows a message but allows Save', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('${base}/new');
    await tester.pumpAndSettle();
${trigger}
${scrollToBottom}
    expect(find.textContaining('${(rule.message ?? "").replace(/'/g, "\\'")}'), findsOneWidget);
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a warn verdict must never block Save');
  });`);
      } else if (rule.severity === "requireJustification") {
        cases.push(`  testWidgets('${t.entity}: ${rule.name} (requireJustification) blocks Save until justified', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('${base}/new');
    await tester.pumpAndSettle();
${trigger}
${scrollToBottom}
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNull, reason: 'requireJustification must block Save until a justification is typed');
    await tester.enterText(find.widgetWithText(TextField, 'Justification'), 'Approved — see attached memo.');
    await tester.pumpAndSettle();
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'typing a justification must unblock Save');
  });`);
      }
    }
  }

  if (!cases.length) return null;

  // Each case independently boots the real app — same GetIt reset need as every other multi-case
  // generated test file (focus/scroll/back).
  const getItReset = `  setUp(() => GetIt.instance.reset());\n\n`;

  return `// [generated] generator=PolicyTestGenerator template=policy_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
import 'package:${pkg}/core/components.dart';
import 'package:${pkg}/core/di.dart';
${session.import}
void main() {
${getItReset}${cases.join("\n\n")}
}
`;
}

/**
 * SplitTestGenerator — structural, deterministic, 0% LLM (MF4 regression guard).
 * Two kinds of case in one file: (1) pure-domain cases compiled straight from the Split oracle
 * (mirrors oracle_test.ts's spirit, but validateSplit isn't a RuleModel — see operations.ts's
 * splitGroupFor doc comment — so this reads the oracle itself rather than reusing
 * RuleOracleTestGenerator, which is hard-wired to `${RuleName}().evaluate(entity)`); (2) one
 * UI case per split-capable CRUD-form entity driving the real form generically (add two split
 * rows via the "Add split" button — no entity-specific knowledge needed since every split row's
 * inputs are labeled identically regardless of app type), asserting the live running total AND
 * that Save is blocked/unblocked exactly at the 100% boundary.
 */
export function generateSplitTest(feature: FeatureModel, oracle: OracleFile | null): string | null {
  if (!hasSplitGroups(feature)) return null;
  const targets = [...crudFormTargets(feature).values()].filter((t) => splitGroupFor(t.entity, feature));
  if (!targets.length) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const session = authSession(feature, pkg, "    ");
  const setup = `    setupDependencies();\n${session.boot}`;

  const domainCases = (oracle?.cases ?? [])
    .map((c, i) => {
      const percents: number[] = c.input.percents ?? [];
      const linesExpr = percents.length
        ? `[${percents.map((p) => `const SplitLine(category: 'x', percent: ${p})`).join(", ")}]`
        : "const <SplitLine>[]";
      const expected = String(c.expected ?? "");
      const expectedExpr = expected ? `['${expected.replace(/'/g, "\\'")}']` : "<String>[]";
      const desc = (expected || "valid").replace(/'/g, "\\'");
      return `  test('validateSplit oracle case ${i + 1}: ${desc}', () {
    expect(validateSplit(${linesExpr}), equals(${expectedExpr}));
  });`;
    })
    .join("\n\n");

  const uiTargets = targets.filter((t) => isTargetReachable(feature, t.entity));
  const uiCases = uiTargets
    .map((t) => {
      const base = `/${kebab(t.entity)}`;
      return `  testWidgets('${t.entity}: split must sum to exactly 100% before Save is enabled', (tester) async {
${setup}    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('${base}/new');
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, 'Add split'));
    await tester.pumpAndSettle();
    await tester.tap(find.widgetWithText(TextButton, 'Add split'));
    await tester.pumpAndSettle();
    await tester.drag(find.byType(ListView), const Offset(0, -2000));
    await tester.pumpAndSettle();
    await tester.enterText(find.widgetWithText(TextField, 'Category').at(0), 'Travel');
    await tester.enterText(find.widgetWithText(TextField, '%').at(0), '90');
    await tester.enterText(find.widgetWithText(TextField, 'Category').at(1), 'Meals');
    await tester.enterText(find.widgetWithText(TextField, '%').at(1), '5');
    await tester.pumpAndSettle();
    expect(find.textContaining('Split total: 95.00%'), findsOneWidget);
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNull, reason: 'a split that does not sum to 100% must block Save');
    await tester.enterText(find.widgetWithText(TextField, '%').at(1), '10');
    await tester.pumpAndSettle();
    expect(find.textContaining('Split total: 100.00%'), findsOneWidget);
    expect(tester.widget<PrimaryButton>(find.byType(PrimaryButton)).onPressed, isNotNull, reason: 'a split summing to exactly 100% must unblock Save');
  });`;
    })
    .join("\n\n");

  const cases = [domainCases, uiCases].filter(Boolean).join("\n\n");
  if (!cases) return null;

  const getItReset = `  setUp(() => GetIt.instance.reset());\n\n`;

  return `// [generated] generator=SplitTestGenerator template=split_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR + Split.oracle.json.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:get_it/get_it.dart';
import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
import 'package:${pkg}/core/components.dart';
import 'package:${pkg}/core/di.dart';
import 'package:${pkg}/generated.dart';
${session.import}

void main() {
${getItReset}${cases}
}
`;
}

/**
 * AttachmentTestGenerator — structural, deterministic, 0% LLM (MF3 regression guard).
 * Emitted only for apps that opt in via `attributes.attachments` (operations.ts's
 * hasAttachments). This is the PORT-MUST-EXIST gate, deliberately stronger than any regex: the
 * generated test compiles against core/attachment.dart THROUGH the generated.dart barrel
 * (ReceiptAttachment/ReceiptOcrPort/MockReceiptOcr/OcrResult — project.ts's generateBarrel exports
 * them only when hasAttachments fires), so if a future change drops the core emission from
 * index.ts (or the barrel export), this file FAILS TO COMPILE — a stash/regression cannot silently
 * ship an attachment-capable app whose runtime module vanished. Beyond existing it also proves the
 * two runtime behaviors MF3 ships: (1) synthesizeAttachment is deterministic (same seed → same
 * checksum/path/size), so the "attach" action is reproducible under CDP; (2) MockReceiptOcr's
 * merchant confidence is deliberately BELOW kLowOcrConfidence, exercising the low-confidence UI
 * path this slice introduced (see attachment.ts's own doc comment).
 */
export function generateAttachmentTest(feature: FeatureModel): string | null {
  if (!hasAttachments(feature)) return null;
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

  return `// [generated] generator=AttachmentTestGenerator template=attachment_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/generated.dart';

void main() {
  test('synthesizeAttachment is deterministic and yields a well-formed attachment', () {
    final a = synthesizeAttachment('slip-001');
    final b = synthesizeAttachment('slip-001');
    final c = synthesizeAttachment('slip-002');
    expect(a.path, b.path, reason: 'same seed must yield the same synthetic path');
    expect(a.checksum, b.checksum, reason: 'same seed must yield the same checksum');
    expect(a.path, isNot(c.path), reason: 'different seed must yield a different path');
    expect(a.checksum, isNotEmpty);
    expect(a.sizeBytes, greaterThan(0));
    expect(a.mimeType, 'image/jpeg');
    final roundtrip = ReceiptAttachment.fromJson(a.toJson());
    expect(roundtrip.checksum, a.checksum, reason: 'toJson/fromJson must round-trip the checksum');
  });

  test('ReceiptOcrPort is implemented by a deterministic mock', () async {
    final port = MockReceiptOcr() as ReceiptOcrPort;
    final result = await port.extract(synthesizeAttachment('slip-002'));
    expect(result.merchant, 'Sample Merchant');
    expect(result.total, 42.50);
    expect(result.currency, 'SAR');
    expect(result.confidence['merchant'], lessThan(kLowOcrConfidence), reason: 'the mock must exercise the low-confidence path MF3 ships');
    expect(result.confidence['total'], greaterThan(kLowOcrConfidence), reason: 'not every field is low-confidence — only merchant');
  });

  test('MockReceiptOcr output is stable across calls', () async {
    final port = MockReceiptOcr();
    final first = await port.extract(synthesizeAttachment('slip'));
    final second = await port.extract(synthesizeAttachment('slip'));
    expect(first.rawText, second.rawText);
    expect(first.date, second.date);
  });
}
`;
}

/**
 * BudgetTestGenerator — structural, deterministic, 0% LLM (MF5).
 * Pure-domain unit tests for BudgetLine (core/budget.dart) — remaining/pctUsed/isOverLimit/
 * remainingAfter math. A calculation, not a business rule (no RuleModel involved), so unit tests
 * suffice — no oracle, same reasoning `generateAttachmentTest` uses. Entity-agnostic: constructs
 * BudgetLine directly with literal Money values, so this file is byte-identical across every app
 * that resolves a budget (Ledgerly's meal budget, work_auth's visa quota, ...) except for the
 * package import.
 */
export function generateBudgetTest(feature: FeatureModel): string | null {
  if (!resolveBudget(feature)) return null;
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

  return `// [generated] generator=BudgetTestGenerator template=budget_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/generated.dart';

void main() {
  const limit = Money(minorUnits: 100000, currency: 'SAR'); // 1,000.00

  test('remaining subtracts committed and actual from the limit', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 20000, currency: 'SAR'), // 200.00 submitted
      actual: const Money(minorUnits: 38000, currency: 'SAR'), // 380.00 approved
    );
    expect(line.remaining.minorUnits, 42000, reason: '1000.00 - 200.00 - 380.00 = 420.00');
  });

  test('pctUsed reports the fraction of the limit already committed+actual', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 20000, currency: 'SAR'),
      actual: const Money(minorUnits: 42000, currency: 'SAR'),
    );
    // (200 + 420) / 1000 = 0.62 — the exact fraction the generated "used X%" UI rounds from.
    expect(line.pctUsed, closeTo(0.62, 0.0001));
    expect((line.pctUsed * 100).round(), 62, reason: "must match the generated UI's used-X% rounding exactly");
  });

  test('a budget exactly at its limit is not over', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 0, currency: 'SAR'),
      actual: limit,
    );
    expect(line.isOverLimit, isFalse);
    expect(line.remaining.minorUnits, 0);
  });

  test('one minor unit over the limit is over-limit and reports a negative remaining', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 0, currency: 'SAR'),
      actual: const Money(minorUnits: 100001, currency: 'SAR'),
    );
    expect(line.isOverLimit, isTrue);
    expect(line.remaining.minorUnits, -1, reason: 'over-limit is a visible negative, never clamped to zero');
    expect(line.pctUsed, greaterThan(1.0), reason: 'pctUsed is not capped at 100% either');
  });

  test('a zero-limit budget reports 0% used, not a divide-by-zero', () {
    final line = BudgetLine(
      scope: 'Unset',
      limit: const Money(minorUnits: 0, currency: 'SAR'),
      committed: const Money(minorUnits: 0, currency: 'SAR'),
      actual: const Money(minorUnits: 0, currency: 'SAR'),
    );
    expect(line.pctUsed, 0);
    expect(line.isOverLimit, isFalse);
  });

  test('remainingAfter projects a hypothetical extra commitment without mutating the line', () {
    final line = BudgetLine(
      scope: 'Meals',
      limit: limit,
      committed: const Money(minorUnits: 20000, currency: 'SAR'),
      actual: const Money(minorUnits: 38000, currency: 'SAR'),
    );
    final projected = line.remainingAfter(const Money(minorUnits: 10000, currency: 'SAR')); // +100.00 pending
    expect(projected.minorUnits, 32000, reason: '420.00 remaining - 100.00 new pending = 320.00');
    expect(line.remaining.minorUnits, 42000, reason: 'remainingAfter must not mutate the original line');
  });
}
`;
}

/**
 * AuditTestGenerator — structural, deterministic, 0% LLM (L3).
 * Covers three independent pieces, only emitting the sections that apply:
 *  1. core/audit.dart (when hasAudit): recordMutation stamps every field; AuditLog is append-only
 *     (its `events` getter is an unmodifiable snapshot, not just "please don't mutate this").
 *  2. core/export.dart (when hasExport): toCsv quotes/escapes per RFC 4180; the header-driven
 *     shape itself proves secret exclusion (a key never in `headers` never appears in the output —
 *     the mechanism screen.ts's exportableFields() relies on, tested here entity-agnostically).
 *  3. Immutability (when a resolved export screen exists): the stash-proofed case — a repo update
 *     on an already-exported row throws. This one IS entity-specific (it drives the first resolved
 *     export-locked entity's real generated repository impl), unlike 1/2 which stay generic.
 */
export function generateAuditTest(feature: FeatureModel, ctx?: GenContext): string | null {
  const audited = hasAudit(feature);
  const exportResolved = resolvedExportScreens(feature);
  if (!audited && !exportResolved.length) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

  const auditTests = audited
    ? `
  test('recordMutation stamps who/what/before/after/reason/at', () {
    final event = recordMutation(
      entity: 'Widget',
      entityId: 'w-1',
      action: 'update',
      actor: 'user-1',
      before: {'status': 'draft'},
      after: {'status': 'submitted'},
      reason: 'submitted for review',
    );
    expect(event.entity, 'Widget');
    expect(event.entityId, 'w-1');
    expect(event.action, 'update');
    expect(event.actor, 'user-1');
    expect(event.before, {'status': 'draft'});
    expect(event.after, {'status': 'submitted'});
    expect(event.reason, 'submitted for review');
    expect(event.timestamp, isA<DateTime>());
    expect(event.id, isNotEmpty);
  });

  test('AuditLog is append-only: events() is an unmodifiable snapshot', () {
    final log = AuditLog.instance;
    final before = log.events.length;
    log.append(recordMutation(entity: 'Widget', entityId: 'w-2', action: 'create', actor: 'user-1', after: {'status': 'draft'}));
    expect(log.events.length, before + 1, reason: 'append must be reflected');
    expect(
      () => log.events.add(recordMutation(entity: 'Widget', entityId: 'w-3', action: 'create', actor: 'user-1')),
      throwsUnsupportedError,
      reason: 'events() must return an unmodifiable list — there is no way to un-append an event',
    );
  });
`
    : "";

  const exportTests = exportResolved.length
    ? `
  test('toCsv quotes/escapes commas, quotes, and embedded newlines (RFC 4180)', () {
    final rows = [
      {'name': 'Simple', 'note': 'plain'},
      {'name': 'Has, comma', 'note': 'plain'},
      {'name': 'Has "quotes"', 'note': 'plain'},
      {'name': 'Has\\nnewline', 'note': 'plain'},
    ];
    final csv = toCsv(rows, const ['name', 'note']);
    final lines = csv.split('\\n');
    expect(lines[0], 'name,note');
    expect(lines[2], '"Has, comma",plain');
    expect(lines[3], '"Has ""quotes""",plain');
    expect(csv.contains('"Has\\nnewline",plain'), isTrue);
  });

  test('toCsv only ever includes the caller-declared headers — a key left out of headers never leaks', () {
    // Mirrors how screen.ts's export button builds headers from exportableFields(), which already
    // excludes secret-typed fields — this proves the MECHANISM generically: toCsv has no way to
    // surface a row key that isn't in the caller-declared header list.
    final rows = [
      {'name': 'Alice', 'ssn': '123-45-6789'},
    ];
    final csv = toCsv(rows, const ['name']);
    expect(csv.contains('123-45-6789'), isFalse);
    expect(csv.contains('Alice'), isTrue);
  });

  test('toJson renders the same rows as a JSON array', () {
    final rows = [
      {'name': 'Alice', 'age': 30},
    ];
    final json = toJson(rows);
    expect(jsonDecode(json), [
      {'name': 'Alice', 'age': 30},
    ]);
  });
`
    : "";

  // Immutability (the stash-proofed case): drives the first resolved export-locked entity's real
  // generated repository impl directly (not via the barrel — an auto `${repo}InMemoryImpl` with no
  // declared repositoryImpls entry isn't barrel-exported, see project.ts's generateBarrel).
  let immutabilityTest = "";
  let repoImport = "";
  const target = exportResolved[0];
  const repo = target ? findRepoForEntity(feature.repositories, target.entity.name) : undefined;
  const kinds = repo && target ? crudOperations(repo, target.entity.name) : undefined;
  if (target && repo && kinds?.list && kinds?.update) {
    const declaredImpl = (feature.repositoryImpls ?? []).find((ri) => ri.contract === repo.name);
    const implName = declaredImpl ? declaredImpl.name : `${repo.name}InMemoryImpl`;
    const entity = target.entity;
    const reconstruct = entity.fields
      .map((f) => (f.name === target.exportedField.name ? "exported: true" : `${f.name}: original.${f.name}`))
      .join(", ");
    // `feature.name` is wrong for the multi-feature merged IR (it's the APP name, not the owning
    // feature's own name the repo impl actually lives under) — ctx.symbols is per-feature-path-
    // aware (built by accumulating each feature's own buildSymbols(f) call) and resolves correctly
    // for both shapes; fall back to feature.name only for the single-feature/no-ctx case where
    // they're the same thing anyway.
    const implPath = ctx?.symbols.get(implName) ?? `features/${feature.name}/data/repositories/${fileName(implName)}`;
    repoImport = `import 'package:${pkg}/${implPath}';\n`;
    immutabilityTest = `
  test('a repo update on an already-exported ${entity.name} row throws (immutability)', () async {
    final repo = ${implName}();
    final items = await repo.${kinds.list.name}();
    final original = items.first;
    final exported = ${entity.name}(${reconstruct});
    await repo.${kinds.update.name}(exported); // not-yet-exported -> exported: allowed
    expect(repo.${kinds.update.name}(exported), throwsA(isA<StateError>()), reason: 'already-exported rows are immutable — corrections require void + clone');
  });
`;
  }

  const needsConvert = exportResolved.length > 0;

  return `// [generated] generator=AuditTestGenerator template=audit_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
${needsConvert ? "import 'dart:convert';\n" : ""}import 'package:${pkg}/generated.dart';
${repoImport}
void main() {${auditTests}${exportTests}${immutabilityTest}}
`;
}

/**
 * OutboxTestGenerator — structural, deterministic, 0% LLM (MF6).
 * Regression-proves core/outbox.dart's queue mechanics generically (enqueue / markSent / markFailed
 * + retry / FIFO replay order — none of this depends on any particular entity) plus one real-repo
 * integration case proving repository_impl.ts's write-ahead hook actually fires. Mirrors
 * audit_test.dart's immutability case: drives a real generated repo impl directly (not via the
 * barrel — an auto `${repo}InMemoryImpl` with no declared repositoryImpls entry isn't
 * barrel-exported, see project.ts's generateBarrel), so this is also the stash-proof oracle —
 * neutering the outbox hook makes the integration assertion fail (message count doesn't grow).
 */
export function generateOutboxTest(feature: FeatureModel, ctx?: GenContext): string | null {
  if (!hasOutbox(feature)) return null;
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

  let integrationTest = "";
  let repoImport = "";
  for (const entity of feature.entities ?? []) {
    const repo = findRepoForEntity(feature.repositories, entity.name);
    if (!repo) continue;
    const kinds = crudOperations(repo, entity.name);
    if (!kinds.create) continue;
    const declaredImpl = (feature.repositoryImpls ?? []).find((ri) => ri.contract === repo.name);
    const implName = declaredImpl ? declaredImpl.name : `${repo.name}InMemoryImpl`;
    // `feature.name` is wrong for the multi-feature merged IR (see audit_test.dart's identical
    // comment) — ctx.symbols is per-feature-path-aware and resolves correctly for both shapes.
    const implPath = ctx?.symbols.get(implName) ?? `features/${feature.name}/data/repositories/${fileName(implName)}`;
    repoImport = `import 'package:${pkg}/${implPath}';\n`;
    const sampleArgs = variantSampleArgs(entity, feature.enums ?? [], feature.valueObjects ?? [], 1);
    integrationTest = `
  test('a repo ${kinds.create.name}() write-ahead-enqueues an OutboxMessage before returning', () async {
    final repo = ${implName}();
    final before = Outbox.instance.pending().length;
    await repo.${kinds.create.name}(${entity.name}(${sampleArgs}));
    final pending = Outbox.instance.pending();
    expect(pending.length, before + 1, reason: 'create() must write-ahead-enqueue exactly one message');
    expect(pending.last.entity, '${entity.name}');
    expect(pending.last.action, 'create');
    expect(pending.last.status, OutboxStatus.pending);
  });
`;
    break;
  }

  return `// [generated] generator=OutboxTestGenerator template=outbox_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/generated.dart';
${repoImport}
void main() {
  test('enqueue adds a pending message', () {
    final before = Outbox.instance.pending().length;
    final msg = Outbox.instance.enqueue(entity: 'Widget', entityId: 'w-1', action: 'create', payload: {'name': 'demo'});
    expect(Outbox.instance.pending().length, before + 1);
    expect(msg.status, OutboxStatus.pending);
    expect(msg.attempts, 0);
    expect(msg.entity, 'Widget');
    expect(msg.action, 'create');
  });

  test('markSent removes a message from pending() without deleting its history', () {
    final msg = Outbox.instance.enqueue(entity: 'Widget', entityId: 'w-2', action: 'update');
    Outbox.instance.markSent(msg.id);
    expect(Outbox.instance.pending().any((m) => m.id == msg.id), isFalse);
    expect(Outbox.instance.all.any((m) => m.id == msg.id && m.status == OutboxStatus.sent), isTrue);
  });

  test('markFailed increments attempts and records the error; retry() makes it pending again', () {
    final msg = Outbox.instance.enqueue(entity: 'Widget', entityId: 'w-3', action: 'delete');
    Outbox.instance.markFailed(msg.id, 'network unreachable');
    final failed = Outbox.instance.all.firstWhere((m) => m.id == msg.id);
    expect(failed.status, OutboxStatus.failed);
    expect(failed.attempts, 1);
    expect(failed.lastError, 'network unreachable');
    expect(Outbox.instance.pending().any((m) => m.id == msg.id), isFalse, reason: 'a failed message is not pending until retried');

    Outbox.instance.retry(msg.id);
    final retried = Outbox.instance.all.firstWhere((m) => m.id == msg.id);
    expect(retried.status, OutboxStatus.pending);
    expect(Outbox.instance.pending().any((m) => m.id == msg.id), isTrue);
  });

  test('pending() replay order is deterministic FIFO — insertion order survives an out-of-order markSent', () {
    final a = Outbox.instance.enqueue(entity: 'Order', entityId: 'o-a', action: 'create');
    final b = Outbox.instance.enqueue(entity: 'Order', entityId: 'o-b', action: 'create');
    final c = Outbox.instance.enqueue(entity: 'Order', entityId: 'o-c', action: 'create');
    Outbox.instance.markSent(b.id);
    final ids = Outbox.instance.pending().map((m) => m.id).where((id) => id == a.id || id == c.id).toList();
    expect(ids, [a.id, c.id], reason: 'replay must preserve original enqueue order');
  });
${integrationTest}}
`;
}

/**
 * AuthTestGenerator — structural, deterministic, 0% LLM.
 * Emits an end-to-end auth regression test for apps that declare `attributes.auth`:
 *  1. The login screen presents every persona from the IR (via kPersonas).
 *  2. An unauthenticated deep link is redirected to /login.
 *  3. Tapping a persona signs the session in and lands on that role's home list.
 *  4. (denial case, emitted only when some screen's entity is outside the first persona's area)
 *     A denied route is redirected to the sign-in-"d" role's own home.
 *  5. Signing out puts the (re-navigating) router back on /login.
 * This mirrors the REQUIREMENTS — demo login w/ personas + guardPath + tenant-ready Session —
 * and is the after-commit oracle for the stash-proof regression (see RCA).
 */
export function generateAuthTest(feature: FeatureModel): string | null {
  if (!hasAuth(feature)) return null;
  const personas = authPersonas(feature);
  if (!personas.length) return null;

  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const auth = feature.attributes?.auth;
  const first = personas[0];
  if (!first) return null;
  const roleHome = auth ? auth.home[first.role] ?? first.role : first.role;
  const homeRoute = `/${kebab(roleHome)}`;
  const homeScreen = homeScreenFor(feature, roleHome);

  const denied = firstDeniedScreenEntity(feature);
  const denial = denied && homeScreen
    ? `  testWidgets('role denied an area is redirected to its own home', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('${first.name}'));
    await tester.pumpAndSettle();
    appRouter.go('/${kebab(denied)}/x');
    await tester.pumpAndSettle();
    expect(find.byType(${homeScreen}), findsOneWidget);
  });
`
    : "";

  const homeExpect = homeScreen ? `expect(find.byType(${homeScreen}), findsOneWidget);` : `expect(Session.instance.isAuthenticated, isTrue);`;

  const personaLines = personas
    .map((p) => `    expect(find.text('${p.name}'), findsWidgets);`)
    .join("\n");

  return `// [generated] generator=AuthTestGenerator template=auth.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:get_it/get_it.dart';
import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/router.dart';
import 'package:${pkg}/core/di.dart';
import 'package:${pkg}/generated.dart';

void main() {
  // GetIt reset + signOut so each test starts fresh (Session is a plucked singleton, not in GetIt).
  setUp(() {
    GetIt.instance.reset();
    Session.instance.signOut();
  });

  testWidgets('login presents every persona from IR', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    expect(find.byType(AuthLoginScreen), findsOneWidget);
${personaLines}
  });

  testWidgets('unauthenticated deep link redirects to login', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    appRouter.go('/${kebab(firstNonLoginEntity(feature))}');
    await tester.pumpAndSettle();
    expect(find.byType(AuthLoginScreen), findsOneWidget);
  });

  testWidgets('tapping a persona signs in and lands on the ${first.role} home', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('${first.name}').last);
    await tester.pumpAndSettle();
    expect(Session.instance.isAuthenticated, isTrue);
    expect(Session.instance.role, '${first.role}');
    expect(Session.instance.displayName, '${first.name}');
    expect(Session.instance.tenantId, '${first.tenantId}');
    expect(appRouter.routerDelegate.currentConfiguration.uri.path, '${homeRoute}');
    ${homeExpect}
  });
${denial}
  testWidgets('sign out returns to login gate', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    await tester.pumpAndSettle();
    await tester.tap(find.text('${first.name}').last);
    await tester.pumpAndSettle();
    expect(Session.instance.isAuthenticated, isTrue);
    Session.instance.signOut();
    await tester.pumpAndSettle();
    appRouter.go('${homeRoute}');
    await tester.pumpAndSettle();
    expect(Session.instance.isAuthenticated, isFalse);
    expect(find.byType(AuthLoginScreen), findsOneWidget);
  });
}
`;
}

// MF2: small helpers for AuthTestGenerator (kept local so the test file stays self-contained).

// Home screen class for an entity: prefers its ListScreen, else its DetailScreen, else null.
function homeScreenFor(feature: FeatureModel, entityName: string): string | null {
  const screens = feature.screens ?? [];
  return (
    screens.find((s) => s.entity === entityName && s.type === "list")?.name ??
    screens.find((s) => s.entity === entityName && s.type === "detail")?.name ??
    null
  );
}

// First entity with a screen whose area is NOT in the first persona's reachable set — used to
// emit the denial assertion. Null when every screen is reachable to the first persona.
function firstDeniedScreenEntity(feature: FeatureModel): string | null {
  const screens = feature.screens ?? [];
  for (const e of feature.entities) {
    if (!isTargetReachable(feature, e.name) && screens.some((s) => s.entity === e.name)) return e.name;
  }
  return null;
}

// First entity with a screen (list or detail) — the deep-link the guard must bounce to login.
function firstNonLoginEntity(feature: FeatureModel): string {
  const screens = feature.screens ?? [];
  const list = screens.find((s) => s.type === "list")?.entity;
  if (list) return list;
  const detail = screens.find((s) => s.type === "detail")?.entity;
  if (detail) return detail;
  return feature.entities[0]?.name ?? "home";
}
