import { ScreenModel, EntityModel, Field } from "../types";
import { GenContext, nullable } from "../dart";

/**
 * ScreenGenerator — structural, deterministic, 0% LLM (list + detail patterns).
 * IR ScreenModel → a BlocBuilder screen bound to a generated cubit/state, rendering
 * the entity's declared fields (P1 real screens) rather than raw toString() dumps.
 */

const TITLE_PRIORITY = ["name", "title", "merchant", "label", "subject"];
const SUBTITLE_TYPES = ["double", "int", "DateTime", "enum"];

// Dart expression rendering one field of `item` (nullable-safe per the field's IR nullability).
function fieldValue(field: Field, item = "item"): string {
  const n = `${item}.${field.name}`;
  const opt = nullable(field);
  switch (field.type) {
    case "String": return opt ? `${n} ?? '—'` : n;
    case "int": return opt ? `(${n}?.toString() ?? '—')` : `${n}.toString()`;
    case "double": return opt ? `(${n}?.toStringAsFixed(2) ?? '—')` : `${n}.toStringAsFixed(2)`;
    case "bool": return opt ? `(${n} == null ? '—' : (${n} ? 'yes' : 'no'))` : `(${n} ? 'yes' : 'no')`;
    case "DateTime": return opt ? `((${n}?.toIso8601String() ?? '').split('T').first)` : `(${n}.toIso8601String().split('T').first)`;
    case "enum": return opt ? `(${n}?.name ?? '—')` : `${n}.name`;
    case "List": return opt ? `'\${(${n} ?? const []).length} items'` : `'\${${n}.length} items'`;
    case "reference": return opt ? `(${n}?.toString() ?? '—')` : `${n}.toString()`;
    default: return `${n}.toString()`;
  }
}

// A display label for a field (humanized snake/camelCase).
function fieldLabel(name: string): string {
  return name.replace(/([a-z0-9])([A-Z])/g, "$1 $2").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function pickTitle(entity: EntityModel): Field | undefined {
  const f = entity.fields.find((x) => TITLE_PRIORITY.includes(x.name));
  if (f) return f;
  const idField = entity.identity?.field ? entity.fields.find((x) => x.name === entity.identity!.field) : undefined;
  if (idField) return idField;
  const str = entity.fields.find((x) => x.type === "String");
  return str ?? entity.fields[0];
}

export function generateScreen(s: ScreenModel, ctx?: GenContext): string {
  const stateClass = `${s.state}State`;
  const statusEnum = `${s.state}Status`;
  const sm = ctx?.sm ?? "bloc";

  const entity = (ctx?.ir?.entities ?? []).find((e: any) => e.name === s.entity) as EntityModel | undefined;

  let body: string;
  if (s.type === "list") {
    const title = entity ? pickTitle(entity) : undefined;
    const subtitleFields = entity
      ? entity.fields.filter((f) => f !== title && SUBTITLE_TYPES.includes(f.type)).slice(0, 2)
      : [];
    const identity = entity?.identity?.field ?? title?.name ?? "toString";
    const titleExpr = title
      ? (nullable(title) ? `item.${title.name} ?? 'Untitled'` : `item.${title.name}`)
      : `item.toString()`;
    const subtitleExpr = subtitleFields.length
      ? `'${subtitleFields.map((f) => `\${${fieldValue(f)}}`).join(" · ")}'`
      : "'—'";
    body = `            return ListView.builder(
              itemCount: state.transactions.length,
              itemBuilder: (_, i) {
                final item = state.transactions[i];
                return ListTile(
                  key: ValueKey(item.${identity}),
                  title: Text(${titleExpr}),
                  subtitle: Text(${subtitleExpr}),
                  trailing: const Icon(Icons.chevron_right),
                );
              },
            );`;
  } else {
    // Detail: render every field as a labeled row from the first loaded item.
    if (entity && entity.fields.length) {
      const rows = entity.fields
        .map((f) => {
          const label = fieldLabel(f.name);
          return `            ListTile(title: Text('${label}'), trailing: Text(${fieldValue(f, "item")})),`;
        })
        .join("\n");
      body = `            if (state.transactions.isEmpty) return const Center(child: Text('No data'));
            final item = state.transactions.first;
            return ListView(
              padding: const EdgeInsets.all(8),
              children: [
${rows}
              ],
            );`;
    } else {
      body = `            return Center(child: Text(state.toString()));`;
    }
  }

  const stateImport = ctx?.symbols.get(s.state)
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get(s.state)}';`
    : `import '${s.state.toLowerCase()}.dart';`;
  const componentsImport = ctx ? `import 'package:${ctx.pkg}/core/components.dart';` : "import '../../core/components.dart';";

  const checks = `        if (state.status == ${statusEnum}.loading) return const LoadingState();
        if (state.status == ${statusEnum}.failure) return ErrorState(message: state.errorMessage);`;

  // Subscription differs by provider (arch layer): bloc = BlocBuilder, riverpod = ConsumerWidget + ref.watch.
  const stateLibImport = sm === "riverpod"
    ? `import 'package:flutter_riverpod/flutter_riverpod.dart';`
    : `import 'package:flutter_bloc/flutter_bloc.dart';`;

  const widgetBody = sm === "riverpod"
    ? `class ${s.name} extends ConsumerWidget {
  const ${s.name}({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final state = ref.watch(${s.state.charAt(0).toLowerCase()}${s.state.slice(1)}Provider);
    return Scaffold(
      appBar: AppBar(title: const Text('${s.name}')),
      body: Builder(builder: (_) {
${checks}
${body}
      }),
    );
  }
}`
    : `class ${s.name} extends StatelessWidget {
  const ${s.name}({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('${s.name}')),
      body: BlocBuilder<${s.state}Cubit, ${stateClass}>(
        builder: (context, state) {
${checks}
${body}
        },
      ),
    );
  }
}`;

  return `// [generated] generator=ScreenGenerator template=screen_${s.type}_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
${stateLibImport}
${componentsImport}
${stateImport}

${widgetBody}
`;
}
