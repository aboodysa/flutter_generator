import { FeatureModel, Field, StateManagementProvider } from "../types";

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
  if (!screen) {
    return `// [generated] generator=GoldenTestGenerator template=golden.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/main.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('app renders (golden)', (tester) async {
    await tester.pumpWidget(const ReplicaApp());
    await expectLater(find.byType(Scaffold), matchesGoldenFile('goldens/app.png'));
  });
}
`;
  }

  const goldenName = screen.name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  // bloc: BlocProvider wraps the screen; riverpod: ProviderScope (notifier.build() seeds data).
  const pumpWidget = sm === "riverpod"
    ? `    await tester.pumpWidget(const ProviderScope(
      child: MaterialApp(home: ${screen.name}()),
    ));`
    : `    await tester.pumpWidget(BlocProvider<${screen.state}Cubit>(
      create: (_) => ${screen.state}Cubit(),
      child: const MaterialApp(home: ${screen.name}()),
    ));`;
  const libImport = sm === "riverpod"
    ? `import 'package:flutter_riverpod/flutter_riverpod.dart';`
    : `import 'package:flutter_bloc/flutter_bloc.dart';`;

  return `// [generated] generator=GoldenTestGenerator template=golden_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
${libImport}
import 'package:${pkg}/generated.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('${screen.name} renders (golden)', (tester) async {
${pumpWidget}
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
  const screen = feature.screens?.[0];
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

  return `// [generated] generator=FlowTestGenerator template=flow.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/main.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('app boots and renders', (tester) async {
    await tester.pumpWidget(const ReplicaApp());
    expect(find.byType(Scaffold), findsWidgets);
  });
}
`;
}
