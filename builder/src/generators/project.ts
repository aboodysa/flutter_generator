import { FeatureModel } from "../types";
import { GenContext } from "../dart";
import { ScoringDecision } from "../scoring";
import { providerFor } from "../provider";

const PROVIDER_VERSIONS: Record<string, string> = {
  bloc: "flutter_bloc: ^8.1.6",
  riverpod: "flutter_riverpod: ^2.5.1",
  none: "",
};

/**
 * ProjectGenerator — structural, deterministic, 0% LLM.
 * Emits a minimal runnable Flutter app shell: pubspec.yaml + main.dart.
 * main.dart imports the generated entities and renders a demo list.
 */
export function generatePubspec(feature: FeatureModel, decision?: ScoringDecision): string {
  const name = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  const sm = decision?.stateManagement ?? "bloc";
  const provider = providerFor(sm);

  // State-management dependency from the provider registry; DI/routing only above the floor.
  const smDep = provider.package ? `  ${provider.package}: ${PROVIDER_VERSIONS[provider.id]}\n` : "";
  const infraDeps = provider.di === "none"
    ? smDep
    : `${smDep}  get_it: ^8.0.1\n  go_router: ^17.1.0\n`;

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
`;
}

export function generateMain(feature: FeatureModel): string {
  const screen = feature.screens?.[0];
  const entityNames = feature.entities.map((e) => e.name).join(", ");

  if (screen) {
    const cubit = `${screen.state}Cubit`;
    return `// [generated] generator=ProjectGenerator template=main.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'generated.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  // A11y (§14.4): expose the semantics tree (aria/text) to the DOM on web so the app
  // is screen-reader readable AND browser-testable (CFT/puppeteer) out of the box.
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
      home: BlocProvider<${cubit}>(
        create: (_) => ${cubit}()..load(),
        child: const ${screen.name}(),
      ),
    );
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

export function generateBarrel(feature: FeatureModel, ctx?: GenContext): string {
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

void main() {
  testWidgets('generated app renders', (tester) async {
    await tester.pumpWidget(const ReplicaApp());
    expect(find.byType(Scaffold), findsWidgets);
  });
}
`;
}
