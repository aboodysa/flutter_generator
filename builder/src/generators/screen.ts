import { ScreenModel, EntityModel, Field, WizardStep } from "../types";
import { GenContext, nullable, kebab, collectionField, fieldLabel, camelize, capitalize, importsFromTypes } from "../dart";
import { compositionFor } from "../composition";
import { crudFormTargets, stepFields, isMoneyField } from "../operations";

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
  // P7-L1: money always renders through Money.format() ("1,250.00 SAR") — never a raw double
  // display, which would silently drop the currency and defeat the whole "never double" goal.
  if (isMoneyField(field)) return opt ? `(${n}?.format() ?? '—')` : `${n}.format()`;
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

// Parent→children navigation (general capability): a detail screen for entity X gains a row that
// links to every other entity Y carrying a `camelize(X) + "Id"` foreign-key field — e.g.
// `FollowUp.taskId` → Task. The child's list screen (see listFilterExpr) then reads the matching
// `?<fk>=<id>` query param and filters to that parent's children only. Works for any app type
// (tasks→follow-ups, projects→tickets, tenants→members, …), no per-app logic in the generator.
function childLinks(entityName: string, entities: Array<{ name: string; fields?: Field[] }>): Array<{ child: string; fkField: string }> {
  const me = camelize(entityName);
  return entities
    .filter((e) => e.name !== entityName)
    .flatMap((e) => {
      const fk = e.fields?.find((f) => f.name === `${me}Id`);
      return fk ? [{ child: e.name, fkField: fk.name }] : [];
    });
}

// Child list query-param filter: if this list screen's entity is a child (has `<Parent>Id` fields),
// a matching `?<fk>=<parentId>` query param (arrived via the parent's detail-screen link) restricts
// the visible rows to that parent's children. Null-safe (no param → no filter). Gated on the entity
// actually carrying the field so unrelated list screens stay unchanged.
function listFilterExpr(entity: EntityModel | undefined, collection: string): string {
  const fk = entity?.fields.find((f) => f.name.endsWith("Id") && f.name !== "id");
  if (!fk) {
    return `    final items = state.${collection};
`;
  }
  return `    final qp = GoRouterState.of(context).uri.queryParameters;
    final items = qp.containsKey('${fk.name}')
        ? state.${collection}.where((e) => e.${fk.name} == qp['${fk.name}']).toList()
        : state.${collection};
`;
}

// P8-W1: one wizard field's input widget — controller-less (TextFormField.initialValue, keyed
// per field so Flutter remounts it on step change) since the value lives in wizard state, not
// local widget state; onChanged writes straight back via the field's generated `set<Field>`
// mutator (state.ts).
function wizardFieldInput(fieldName: string, field: Field | undefined, setterCall: (valueExpr: string) => string): string {
  const label = fieldLabel(fieldName);
  const key = `const ValueKey('field-${fieldName}')`;
  if (!field) return `Text('${label} — unknown field')`;
  // P7-L1: decimal text -> Money(minorUnits: ..., currency: ...), never a raw double state field.
  if (isMoneyField(field)) {
    const parse = `(v.isEmpty ? null : Money(minorUnits: ((double.tryParse(v) ?? 0.0) * 100).round(), currency: '${field.currency}'))`;
    return `TextFormField(key: ${key}, initialValue: state.${field.name} != null ? (state.${field.name}!.minorUnits / 100).toStringAsFixed(2) : '', keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '${label}', suffixText: '${field.currency}'), onChanged: (v) => ${setterCall(parse)})`;
  }
  switch (field.type) {
    case "String":
      return `TextFormField(key: ${key}, initialValue: state.${field.name} ?? '', decoration: const InputDecoration(labelText: '${label}'), onChanged: (v) => ${setterCall("v")})`;
    case "int":
      return `TextFormField(key: ${key}, initialValue: state.${field.name}?.toString() ?? '', keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '${label}'), onChanged: (v) => ${setterCall("int.tryParse(v)")})`;
    case "double":
      return `TextFormField(key: ${key}, initialValue: state.${field.name}?.toString() ?? '', keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '${label}'), onChanged: (v) => ${setterCall("double.tryParse(v)")})`;
    case "DateTime":
      return `TextFormField(key: ${key}, initialValue: state.${field.name}?.toIso8601String() ?? '', decoration: const InputDecoration(labelText: '${label}', hintText: 'YYYY-MM-DD'), onChanged: (v) => ${setterCall("DateTime.tryParse(v)")})`;
    case "bool":
      return `CheckboxListTile(key: ${key}, value: state.${field.name} ?? false, title: Text('${label}'), onChanged: (v) => ${setterCall("v")})`;
    case "enum": {
      const enumType = field.of ?? capitalize(field.name);
      return `DropdownButton<${enumType}>(key: ${key}, value: state.${field.name}, hint: Text('${label}'), items: ${enumType}.values.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(), onChanged: (v) => ${setterCall("v")})`;
    }
    default:
      return `Text('${label} — unsupported step field type')`;
  }
}

// A field's current value as read-only display text — reused by the review/result step summary
// below (P8-W4: an info step with no fields of its own shows what earlier steps collected).
function wizardFieldSummaryLine(fieldName: string, field: Field | undefined): string {
  const label = fieldLabel(fieldName);
  if (!field) return `Text('${label}: —')`;
  const display = isMoneyField(field)
    ? `(state.${field.name}?.format() ?? '—')`
    : field.type === "bool"
      ? `(state.${field.name} == null ? '—' : (state.${field.name}! ? 'yes' : 'no'))`
      : field.type === "enum"
        ? `(state.${field.name}?.name ?? '—')`
        : `(state.${field.name}?.toString() ?? '—')`;
  return `Text('${label}: \${${display}}')`;
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

  // §5.2-F1: create/edit/delete affordances, gated on what the entity's repository actually
  // supports (crudFormTargets is the single source shared with route.ts/index.ts/symbols.ts).
  const crudTarget = ctx?.ir ? crudFormTargets(ctx.ir).get(s.entity) : undefined;
  const canEditCreate = !!crudTarget;
  const canDelete = !!crudTarget?.delete;
  const hasDetailScreen = (ctx?.ir?.screens ?? []).some((sc: any) => sc.entity === s.entity && sc.type === "detail");
  const formPath = `/${kebab(s.entity)}`;
  const readMutator = (method: string, args: string) =>
    sm === "riverpod" ? `ref.read(${camelize(s.state)}Provider.notifier).${method}(${args})` : `context.read<${s.state}Cubit>().${method}(${args})`;

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
  let wizardTypeImports = ""; // enum types explicitly named in a wizard's field widgets (DropdownButton<Enum>) — screen.ts otherwise never writes a bare type name that needs its own import.
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
      // Parent→children navigation rows (general capability): one per child entity carrying
      // `camelize(parent)+"Id"` (e.g. FollowUp.taskId under a Task detail). Links to the child's
      // list with `?<fk>=<id>`; the child list screen filters on that query param (listFilterExpr).
      const allEntities = (ctx?.ir?.entities ?? []) as Array<{ name: string; fields?: Field[] }>;
      const children = childLinks(s.entity, allEntities);
      const childRows = children.length
        ? "\n" + children.map((c) => `              const SizedBox(height: ${comp.itemGap}.0),\n              AppListCard(card: ${cardSurface}, title: Text('View ${c.child}s'), trailing: const Icon(Icons.chevron_right), onTap: () => context.go('/${kebab(c.child)}?${c.fkField}=\${id}')),`).join("\n")
        : "";
      body = `            if (state.${collection}.isEmpty) return const Center(child: Text('No data'));
            final item = state.${collection}.firstWhere((e) => e.${identityField} == id, orElse: () => state.${collection}.first);
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
${heroBlock}
${rowsBlock}${childRows}
              ],
            );`;
    } else {
      body = `            return Center(child: Text(state.toString()));`;
    }
  } else if (comp.layout === "wizard") {
    // P8-W1/W2/W3/W4: step header (progress + title) + current step's field(s) + Next/Back/
    // Finish footer, gated by state.canAdvance and state.isLastStep (state.ts — the latter is
    // dynamic once branching is involved, never a compile-time index). No local widget state —
    // each field's value lives in wizard state (via TextFormField.initialValue, keyed per field)
    // so it survives rebuilds without a StatefulWidget.
    const steps: WizardStep[] = s.steps ?? [];
    const fieldDef = (name: string) => (entity ? entity.fields.find((f) => f.name === name) : undefined);
    const setterCall = (fieldName: string) => (valueExpr: string) => readMutator(`set${capitalize(fieldName)}`, valueExpr);

    const titleCases = steps
      .map((st, i) => `                      ${i} => '${st.title.replace(/'/g, "\\'")}',`)
      .join("\n");
    // A field-collecting step renders its input(s) (one or many — P8-W4); an info/review step
    // renders a read-only summary of every field collected by EARLIER steps (generic — this is
    // what makes a plain "review this before continuing" step useful without any per-app logic
    // in the generator).
    const stepContent = (st: WizardStep, index: number): string => {
      const flds = stepFields(st);
      // Every step shows a read-only summary of whatever earlier steps collected, ABOVE its own
      // input(s) if any — a generic "here's what's been entered so far" breadcrumb. This is what
      // makes a plain info step (no fields) double as a review/result screen (P8-W4's "Manager
      // review"/"Result" steps) without any bespoke per-app logic in the generator: a step with
      // its own field(s) gets the summary PLUS an editable input; a step with none is pure review.
      const collectedSoFar = Array.from(new Set(steps.slice(0, index).flatMap(stepFields)));
      const summaryLines = collectedSoFar.map((f) => `                        ${wizardFieldSummaryLine(f, fieldDef(f))},`).join("\n");
      if (flds.length) {
        const widgets = flds.map((f) => `                        ${wizardFieldInput(f, fieldDef(f), setterCall(f))},`).join("\n");
        const body = summaryLines ? `${summaryLines}\n${widgets}` : widgets;
        return `Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [\n${body}\n                      ])`;
      }
      if (!collectedSoFar.length) return `Text('${st.title.replace(/'/g, "\\'")}')`;
      return `Column(mainAxisSize: MainAxisSize.min, crossAxisAlignment: CrossAxisAlignment.start, children: [\n${summaryLines}\n                      ])`;
    };
    const contentCases = steps
      .map((st, i) => `                      ${i} => ${stepContent(st, i)},`)
      .join("\n");

    // Every step's field is rendered somewhere (either as an editable input or a summary line),
    // so any enum field bound to ANY step needs its type imported — the wizard body writes the
    // enum type name literally (`DropdownButton<Priority>`, `Priority.values`), unlike the
    // list/detail bodies which only ever access `.name` on an already-typed expression.
    const allStepFieldNames = Array.from(new Set(steps.flatMap(stepFields)));
    const stepFieldDefs = allStepFieldNames.map(fieldDef).filter((f): f is Field => !!f);
    const enumTypeNames = stepFieldDefs
      .filter((f) => f.type === "enum")
      .map((f) => f.of || capitalize(f.name));
    // P7-L1: wizardFieldInput's money branch writes `Money(minorUnits: ..., currency: ...)`
    // literally in this file (same reason enum types need an explicit import above it).
    const moneyTypeNames = stepFieldDefs.some(isMoneyField) ? ["Money"] : [];
    wizardTypeImports = importsFromTypes([...enumTypeNames, ...moneyTypeNames], ctx).join("\n");

    body = `            if (state.status == ${statusEnum}.success) return const Center(child: Text('All done!'));
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LinearProgressIndicator(value: (state.currentStep + 1) / ${Math.max(steps.length, 1)}),
                Padding(
                  padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.lg, AppSpacing.md, ${comp.heroGap}.0),
                  child: Text(
                    switch (state.currentStep) {
${titleCases}
                      _ => '',
                    },
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                    child: switch (state.currentStep) {
${contentCases}
                      _ => const SizedBox(),
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(${comp.itemGap}.0),
                  child: Row(
                    children: [
                      if (state.currentStep > 0)
                        TextButton(onPressed: () => ${readMutator("back", "")}, child: const Text('Back')),
                      const Spacer(),
                      PrimaryButton(
                        label: state.isLastStep ? 'Finish' : 'Next',
                        onPressed: state.canAdvance
                            ? () {
                                if (state.isLastStep) {
                                  ${readMutator("finish", "")};
                                } else {
                                  ${readMutator("next", "")};
                                }
                              }
                            : null,
                      ),
                    ],
                  ),
                ),
              ],
            );`;
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
    // Row tap/trailing: navigate to the detail screen when one exists; otherwise (§5.2-F1) tap
    // navigates straight to the edit form and a trailing delete icon replaces the chevron —
    // there's nowhere else for those affordances to live without a detail screen.
    const onTapTarget = !hasDetailScreen && canEditCreate ? `${formPath}/\${item.${identity}}/edit` : `${detailPath}/\${item.${identity}}`;
    const trailingWidget = !hasDetailScreen && canDelete
      ? `IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () => ${readMutator("delete", `item.${identity}`)})`
      : `const Icon(Icons.chevron_right)`;
    // Parent-scoped list filtering (child list screens reached via a parent's detail link): a
    // `?<fk>=<parentId>` query param restricts rows to that parent's children; no param → all rows.
    const listFilter = listFilterExpr(entity, collection);
    body = `${listFilter}            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
${heroBlock}
                Expanded(
                  child: ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md, vertical: AppSpacing.sm),
                    itemCount: items.length,
                    itemBuilder: (_, i) {
                      final item = items[i];
                      return Padding(
                        padding: const EdgeInsets.only(bottom: ${comp.itemGap}.0),
                        child: AppListCard(
                          key: ValueKey(item.${identity}),
                          card: ${cardSurface},
                          leading: AppAvatar(label: ${titleExpr}),
                          title: Text(${titleExpr}),
                          subtitle: Text(${subtitleExpr}),
                          trailing: ${trailingWidget},
                          onTap: () => context.go('${onTapTarget}'),
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

  // Detail-only: `id` is read once at the top of build() so both the AppBar edit/delete actions
  // and the nested BlocBuilder/Builder body can use it (§5.2-F1).
  const preBuild = comp.layout === "detail" ? `    final id = GoRouterState.of(context).pathParameters['id'];\n` : "";

  // tooltip: doubles as the accessible/semantic label for these icon-only buttons (Flutter maps
  // IconButton/FloatingActionButton `tooltip` to the semantics label) — required for CDP flow
  // drivers (research/cdp_flow_test.json) to locate them by aria-label, not just a11y hygiene.
  const appBarActions = comp.layout === "detail" && (canEditCreate || canDelete)
    ? `,\n      actions: [\n` +
      (canEditCreate ? `        IconButton(tooltip: 'Edit', icon: const Icon(Icons.edit), onPressed: () => context.go('${formPath}/\${id}/edit')),\n` : "") +
      (canDelete ? `        IconButton(tooltip: 'Delete', icon: const Icon(Icons.delete), onPressed: () async { await ${readMutator("delete", "id!")}; if (context.mounted) context.go('${formPath}'); }),\n` : "") +
      `      ]`
    : "";

  const fab = comp.layout !== "detail" && comp.layout !== "wizard" && canEditCreate
    ? `,\n      floatingActionButton: FloatingActionButton(\n        tooltip: 'New ${s.entity}',\n        onPressed: () => context.go('${formPath}/new'),\n        child: const Icon(Icons.add),\n      )`
    : "";

  const widgetBody = sm === "riverpod"
    ? `class ${s.name} extends ConsumerWidget {
  const ${s.name}({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
${preBuild}    final state = ref.watch(${s.state.charAt(0).toLowerCase()}${s.state.slice(1)}Provider);
    return Scaffold(
      appBar: AppBar(title: const Text('${s.name}')${appBarActions}),
      body: Builder(builder: (_) {
${checks}
${body}
      })${fab},
    );
  }
}`
    : `class ${s.name} extends StatelessWidget {
  const ${s.name}({super.key});

  @override
  Widget build(BuildContext context) {
${preBuild}    return Scaffold(
      appBar: AppBar(title: const Text('${s.name}')${appBarActions}),
      body: BlocBuilder<${s.state}Cubit, ${stateClass}>(
        builder: (context, state) {
${checks}
${body}
        },
      )${fab},
    );
  }
}`;

  // go_router is only referenced by list (onTap navigation) and detail (pathParameters) bodies —
  // a wizard screen navigates entirely through its own Cubit/Notifier methods.
  const routerImport = comp.layout !== "wizard" ? `import 'package:go_router/go_router.dart';\n` : "";

  return `// [generated] generator=ScreenGenerator template=screen_${s.type}_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
${routerImport}${stateLibImport}
${componentsImport}
${themeImport}
${stateImport}
${wizardTypeImports}

${widgetBody}
`;
}
