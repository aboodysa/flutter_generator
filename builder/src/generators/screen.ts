import { ScreenModel, EntityModel, Field } from "../types";
import { GenContext, nullable, kebab, collectionField } from "../dart";
import { compositionFor } from "../composition";

/**
 * ScreenGenerator — structural, deterministic, 0% LLM.
 * IR ScreenModel → a provider-bound screen rendering the entity's declared fields.
 * Composition (hero, rhythm, surface) is driven by the composition registry — `comp.surface`,
 * `comp.hasHero`, `comp.heroGap`, `comp.itemGap` all actually drive the emitted layout (SOLID
 * review #2: they used to be computed and ignored). Rows are built from the Component Registry's
 * `AppListCard`/`AppAvatar` (components.ts), never raw `Card`/`ListTile`/`CircleAvatar` (#3).
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

// Hero = IR-declared literal headline (focal point). Field-based heroes are a later extension.
function heroExpr(s: ScreenModel): string | null {
  if (!s.hero) return null;
  return `'${s.hero.replace(/'/g, "\\'")}'`;
}

export function generateScreen(s: ScreenModel, ctx?: GenContext): string {
  const stateClass = `${s.state}State`;
  const statusEnum = `${s.state}Status`;
  const sm = ctx?.sm ?? "bloc";
  const comp = compositionFor(s.type);
  const collection = collectionField(s.entity);
  const cardSurface = comp.surface !== "plain"; // Dart bool literal driving AppListCard(card: ...)

  const entity = (ctx?.ir?.entities ?? []).find((e: any) => e.name === s.entity) as EntityModel | undefined;
  const identityField = entity?.identity?.field ?? "id";

  // Hero block: gated by the archetype (comp.hasHero) AND an IR-declared headline — an archetype
  // with hasHero:false never renders one even if `s.hero` is set, and vice versa. heroGap (the
  // registry's rhythm field) drives the padding below the hero.
  const hero = heroExpr(s);
  const heroBlock = comp.hasHero && hero
    ? `        Padding(
          padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.lg, AppSpacing.md, ${comp.heroGap}.0),
          child: Text(${hero}, style: Theme.of(context).textTheme.headlineMedium),
        ),`
    : "";

  let body: string;
  if (comp.layout === "detail") {
    if (entity && entity.fields.length) {
      const rows = entity.fields.map((f) => {
        const label = fieldLabel(f.name);
        return `AppListCard(card: ${cardSurface}, title: Text('${label}'), trailing: Text(${fieldValue(f, "item")})),`;
      });
      // itemGap (registry rhythm field) separates rows via a SizedBox, not a hardcoded constant.
      const rowsBlock = rows
        .map((r, i) => (i === 0 ? `              ${r}` : `              const SizedBox(height: ${comp.itemGap}.0),\n              ${r}`))
        .join("\n");
      body = `            if (state.${collection}.isEmpty) return const Center(child: Text('No data'));
            final id = GoRouterState.of(context).pathParameters['id'];
            final item = state.${collection}.firstWhere((e) => e.${identityField} == id, orElse: () => state.${collection}.first);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
${heroBlock}
${rowsBlock}
              ],
            );`;
    } else {
      body = `            return Center(child: Text(state.toString()));`;
    }
  } else {
    // list (default): AppListCard rows (surface driven by comp.surface) + optional hero.
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
    // Detail route target (routing.ts's screenPath() is the source of truth for the router
    // itself; this is the same no-collision formula screen.ts uses for the common case — see
    // AGENTS/DESIGN note in route.ts).
    const detailPath = `/${kebab(s.entity)}`;
    body = `            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
${heroBlock}
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                    itemCount: state.${collection}.length,
                    itemBuilder: (_, i) {
                      final item = state.${collection}[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ${comp.itemGap}.0),
                        child: AppListCard(
                          key: ValueKey(item.${identity}),
                          card: ${cardSurface},
                          leading: AppAvatar(label: ${titleExpr}),
                          title: Text(${titleExpr}),
                          subtitle: Text(${subtitleExpr}),
                          trailing: const Icon(Icons.chevron_right),
                          onTap: () => context.go('${detailPath}/\${item.${identity}}'),
                        ),
                      );
                    },
                  ),
                ),
              ],
            );`;
  }

  const stateImport = ctx?.symbols.get(s.state)
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get(s.state)}';`
    : `import '${s.state.toLowerCase()}.dart';`;
  const componentsImport = ctx ? `import 'package:${ctx.pkg}/core/components.dart';` : "import '../../core/components.dart';";
  const themeImport = ctx ? `import 'package:${ctx.pkg}/core/theme.dart';` : "import '../../core/theme.dart';";

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
import 'package:go_router/go_router.dart';
${stateLibImport}
${componentsImport}
${themeImport}
${stateImport}

${widgetBody}
`;
}
