import { FeatureModel, StateManagementProvider } from "../types";
import { PkgContext } from "../dart";
import { ArchitectureDecision } from "../arch";
import { providerFor } from "../provider";
import { persistenceFor } from "../persistence";
import { hasMoneyFields } from "../operations";

const PROVIDER_VERSIONS: Record<string, string> = {
  bloc: "^8.1.6",
  riverpod: "^2.5.1",
  none: "",
};

/**
 * ProjectGenerator — structural, deterministic, 0% LLM.
 * Emits a minimal runnable Flutter app shell: pubspec.yaml + main.dart.
 * main.dart imports the generated entities and renders a demo list.
 */
export function generatePubspec(feature: FeatureModel, decision?: ArchitectureDecision): string {
  const name = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const sm = decision?.stateManagement ?? "bloc";
  const provider = providerFor(sm);

  // Dependencies derived from the arch layer: state-mgmt package (provider), get_it (DI),
  // go_router (routing), persistence backend (drift/hive_ce). Each is added only when its
  // axis is actually selected.
  const smDep = provider.package ? `  ${provider.package}: ${PROVIDER_VERSIONS[provider.id]}\n` : "";
  const diDep = decision?.di === "get_it" ? "  get_it: ^8.0.1\n" : "";
  const routingDep = decision?.routing === "go_router" ? "  go_router: ^17.1.0\n" : "";
  const persistence = persistenceFor(decision?.persistence ?? "none");
  const persistenceDep = persistence.package ? `  ${persistence.package}: ${persistence.version}\n` : "";
  const infraDeps = `${smDep}${diDep}${routingDep}${persistenceDep}`;

  return `# [generated] generator=ProjectGenerator template=pubspec.v1 class=structural ownership=generated
# Do not hand-edit this file; regenerate from IR.
name: ${name}
description: Generated replica of the ${feature.name} feature.
publish_to: 'none'
version: 1.0.0+1

environment:
  sdk: ^3.0.0

dependencies:
  flutter:
    sdk: flutter
  equatable: ^2.0.5
${infraDeps}  dio: ^5.8.0+1
  flutter_secure_storage: ^9.2.4

dev_dependencies:
  flutter_test:
    sdk: flutter
  flutter_lints: ^3.0.0

flutter:
  uses-material-design: true
  fonts:
    - family: Roboto
      fonts:
        - asset: assets/fonts/Roboto-Regular.ttf
        - asset: assets/fonts/Roboto-Medium.ttf
          weight: 500
        - asset: assets/fonts/Roboto-Bold.ttf
          weight: 700
    - family: MaterialIcons
      fonts:
        - asset: assets/fonts/MaterialIcons-Regular.otf
`;
}

export function generateMain(feature: FeatureModel, sm: StateManagementProvider = "bloc"): string {
  const entityNames = feature.entities.map((e) => e.name).join(", ");

  // Every screen's state owns a cubit that must be available to its route — a single-feature
  // app with one list screen only ever needed screens[0], but multi-entity samples (Task +
  // FollowUp) render more than one list/detail route, each reading `context.read<XCubit>()` /
  // `BlocBuilder<XCubit, ...>`. Failing to provide them all crashed at runtime with
  // ProviderNotFoundException (RCA: main.dart only wrapped screens[0]). Nest one BlocProvider
  // per distinct state so every route's cubit is in scope; riverpod self-builds via ProviderScope.
  const distinctStates = [...new Set((feature.screens ?? []).map((s) => s.state))];

  if (feature.screens?.length) {
    // bloc: nest a BlocProvider per distinct state (each seeds via its use case + in-memory repo);
    // riverpod: single ProviderScope (notifiers build + seed themselves). Navigation via appRouter.
    const buildReturn = sm === "riverpod"
      ? `    return ProviderScope(
      child: MaterialApp.router(
        title: 'Generated app',
        theme: ThemeData(colorSchemeSeed: Colors.teal),
        routerConfig: appRouter,
      ),
    );`
      : `    return ${[...distinctStates]
          .map((st, i) => `BlocProvider<${st}Cubit>(\n      create: (_) => sl<${st}Cubit>()..load(),\n      child: `)
          .join("")}MaterialApp.router(
        title: 'Generated app',
        theme: ThemeData(colorSchemeSeed: Colors.teal),
        routerConfig: appRouter,
      )${distinctStates.map(() => ")").join("")};`;
    const providerImport = sm === "riverpod"
      ? `import 'package:flutter_riverpod/flutter_riverpod.dart';`
      : `import 'package:flutter_bloc/flutter_bloc.dart';`;
    // bloc references the cubit from generated.dart + get_it DI; riverpod only needs appRouter.
    const generatedImport = sm === "riverpod" ? "" : `import 'generated.dart';`;
    const diImport = sm === "riverpod" ? "" : `import 'core/di.dart';`;
    const setupDeps = sm === "riverpod" ? "" : `  setupDependencies();`;

    return `// [generated] generator=ProjectGenerator template=main.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
${providerImport}
${generatedImport}import 'core/router.dart';
${diImport}
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // A11y (§14.4): expose the semantics tree (aria/text) to the DOM on web so the app
  // is screen-reader readable AND browser-testable (CFT/puppeteer) out of the box.
  SemanticsBinding.instance.ensureSemantics();
${setupDeps}
  runApp(const ReplicaApp());
}

class ReplicaApp extends StatelessWidget {
  const ReplicaApp({super.key});

  @override
  Widget build(BuildContext context) {
${buildReturn}
  }
}
`;
  }

  // No screens: demo shell listing generated entities.
  return `// [generated] generator=ProjectGenerator template=main.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  SemanticsBinding.instance.ensureSemantics();
  runApp(const ReplicaApp());
}

class ReplicaApp extends StatelessWidget {
  const ReplicaApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Generated app',
      theme: ThemeData(colorSchemeSeed: Colors.teal),
      home: Scaffold(
        appBar: AppBar(title: const Text('Generated app')),
        body: Center(child: Text('Entities: ${entityNames}')),
      ),
    );
  }
}
`;
}

// MF1: main.dart for an app spanning multiple features. Each feature's FIRST screen gets a
// route (route.ts, unchanged, already merges all features' screens); this only needs to make
// each of those screens' Cubit available app-wide. For bloc that's a MultiBlocProvider with one
// entry per feature (mirrors generateMain's single BlocProvider, just N of them); for riverpod
// no extra wiring is needed at all — providers self-register on first `ref.watch`, so the body is
// identical to generateMain's riverpod branch regardless of feature count.
export function generateMultiMain(features: FeatureModel[], sm: StateManagementProvider = "bloc"): string {
  const primaryStates = Array.from(new Set(features.map((f) => f.screens?.[0]?.state).filter((s): s is string => !!s)));

  const buildReturn = sm === "riverpod"
    ? `    return ProviderScope(
      child: MaterialApp.router(
        title: 'Generated app',
        theme: ThemeData(colorSchemeSeed: Colors.teal),
        routerConfig: appRouter,
      ),
    );`
    : `    return MultiBlocProvider(
      providers: [
${primaryStates.map((s) => `        BlocProvider<${s}Cubit>(create: (_) => sl<${s}Cubit>()..load()),`).join("\n")}
      ],
      child: MaterialApp.router(
        title: 'Generated app',
        theme: ThemeData(colorSchemeSeed: Colors.teal),
        routerConfig: appRouter,
      ),
    );`;
  const providerImport = sm === "riverpod"
    ? `import 'package:flutter_riverpod/flutter_riverpod.dart';`
    : `import 'package:flutter_bloc/flutter_bloc.dart';`;
  const generatedImport = sm === "riverpod" ? "" : `import 'generated.dart';`;
  const diImport = sm === "riverpod" ? "" : `import 'core/di.dart';`;
  const setupDeps = sm === "riverpod" ? "" : `  setupDependencies();`;

  return `// [generated] generator=ProjectGenerator template=main_multi.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
${providerImport}
${generatedImport}import 'core/router.dart';
${diImport}
void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // A11y (§14.4): expose the semantics tree (aria/text) to the DOM on web so the app
  // is screen-reader readable AND browser-testable (CFT/puppeteer) out of the box.
  SemanticsBinding.instance.ensureSemantics();
${setupDeps}
  runApp(const ReplicaApp());
}

class ReplicaApp extends StatelessWidget {
  const ReplicaApp({super.key});

  @override
  Widget build(BuildContext context) {
${buildReturn}
  }
}
`;
}

export function generateBarrel(feature: FeatureModel, ctx?: PkgContext): string {
  const files: string[] = [];
  const names: string[] = [];
  for (const e of feature.enums ?? []) names.push(e.name);
  for (const vo of feature.valueObjects ?? []) names.push(vo.name);
  for (const q of feature.queries ?? []) names.push(q.name);
  for (const w of feature.wrappers ?? []) names.push(w.name);
  for (const ent of feature.entities) { names.push(ent.name); names.push(`${ent.name}Model`); }
  for (const repo of feature.repositories ?? []) names.push(repo.name);
  for (const u of feature.useCases ?? []) names.push(u.name);
  for (const d of feature.datasources ?? []) names.push(d.name);
  for (const ri of feature.repositoryImpls ?? []) names.push(ri.name);
  for (const s of feature.states ?? []) names.push(s.name);
  for (const sc of feature.screens ?? []) names.push(sc.name);
  for (const r of feature.businessRules ?? []) names.push(r.name);
  // P7-L1: unit_test.ts/oracle_test.ts only import this barrel (not core/money.dart directly) —
  // without this, a generated test that literally writes `Money(...)` fails to compile.
  if (hasMoneyFields(feature)) names.push("Money");

  for (const n of names) {
    const p = ctx?.symbols.get(n);
    files.push(p ? `export 'package:${ctx!.pkg}/${p}';` : `export '${n.toLowerCase()}.dart';`);
  }
  return `// [generated] generator=ProjectGenerator template=barrel.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
${files.join("\n")}
`;
}

export function generateWidgetTest(feature: FeatureModel): string {
  const pkg = `rasheed_replica_${feature.name.replace(/[^a-z0-9_]/g, "_")}`;
  return `// [generated] generator=ProjectGenerator template=widget_test.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter/material.dart';
import 'package:${pkg}/main.dart';
import 'package:${pkg}/core/di.dart';

void main() {
  testWidgets('generated app renders', (tester) async {
    setupDependencies();
    await tester.pumpWidget(const ReplicaApp());
    expect(find.byType(Scaffold), findsWidgets);
  });
}
`;
}
