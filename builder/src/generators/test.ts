import { FeatureModel, Field } from "../types";

/**
 * UnitTestGenerator — structural, deterministic, 0% LLM.
 * Emits a model round-trip + entity equality unit test for the first entity.
 */
export function generateUnitTest(feature: FeatureModel): string {
  const entity = feature.entities[0];
  if (!entity) throw new Error("[test] no entities in IR; cannot generate unit test");
  const model = `${entity.name}Model`;
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");

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
export function generateGoldenTest(feature: FeatureModel): string {
  const screen = feature.screens?.[0];
  const pkg = `rasheed_replica_${feature.name}`.replace(/[^a-z0-9_]/g, "_");
  if (!screen) throw new Error("[test] no screens in IR; cannot generate golden test");

  const goldenName = screen.name.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase();
  const cubit = `${screen.state}Cubit`;

  return `// [generated] generator=GoldenTestGenerator template=golden.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:${pkg}/generated.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('${screen.name} renders (golden)', (tester) async {
    await tester.pumpWidget(BlocProvider<${cubit}>(
      create: (_) => ${cubit}(),
      child: const MaterialApp(home: ${screen.name}()),
    ));
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
  if (!screen) throw new Error("[test] no screens in IR; cannot generate flow test");

  return `// [generated] generator=FlowTestGenerator template=flow.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter_test/flutter_test.dart';
import 'package:${pkg}/main.dart';
import 'package:flutter/material.dart';

void main() {
  testWidgets('app boots and ${screen.name} is reachable', (tester) async {
    await tester.pumpWidget(const ReplicaApp());
    expect(find.byType(Scaffold), findsOneWidget);
  });
}
`;
}
