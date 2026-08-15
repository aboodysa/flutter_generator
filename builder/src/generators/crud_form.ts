import { EntityModel, Field } from "../types";
import { GenContext, nullable, hasDefault, defaultValue, sampleArgFor, fieldLabel, kebab, collectionField, capitalize, camelize, importsFromTypes, newIdExpr } from "../dart";
import { CrudFormTarget, isMoneyField, crudEditableFields, fieldRole, FieldRoleContext } from "../operations";

/**
 * CrudFormGenerator — structural, deterministic, 0% LLM (§5.2-F1).
 * Synthesizes a create/edit form screen from an entity's own fields — not a hand-declared
 * `FormModel` (that generator, form.ts, is IR-authored and disconnected from entities/state;
 * this one is IR-derived and fully wired to the entity's Cubit/Notifier create/update methods).
 * One screen serves both create (`id` path param absent) and edit (`id` present, prefilled from
 * the already-loaded list state — no extra `get` round trip needed).
 *
 * Editable fields are the primitive-typed ones (String/int/double/bool/DateTime/enum), excluding
 * the identity field (generated on create, immutable on edit). Reference/List fields aren't
 * editable here (relational form UI is a later extension) — their value is carried forward from
 * the record being edited, or defaulted on create, so submitting never drops data silently.
 */

function usesController(f: Field): boolean {
  return f.type === "String" || f.type === "int" || f.type === "double" || f.type === "DateTime";
}

function controllerDecl(f: Field): string {
  return `  final _${f.name} = TextEditingController();`;
}

// Field initializers run before `widget` is attached (Dart forbids referencing instance members —
// `widget.initial` — in a field initializer), so bool/enum state vars start at a widget-independent
// default here and get overwritten from `widget.initial` in initState() (see initStateLine).
function stateVarDecl(f: Field): string {
  if (f.type === "bool") {
    const dflt = f.default !== undefined ? String(f.default) : "false";
    return `  bool _${f.name} = ${dflt};`;
  }
  const enumType = f.of ?? capitalize(f.name);
  return `  ${enumType} _${f.name} = ${enumType}.values.first;`;
}

function initStateLine(f: Field): string | null {
  // A single `i?.` already short-circuits the whole chain when `i` is null; a second `?.` on a
  // field that isn't itself nullable is redundant (Dart flags it: "can't be used because of
  // short-circuiting") — so the second link only gets `?.` when the field's own type is nullable.
  const chain = nullable(f) ? "?." : ".";
  // P7-L1: Money's underlying `type` is "double" but it repopulates from `.minorUnits / 100`, not
  // `.toString()` — checked before the "double" case below.
  if (isMoneyField(f)) {
    const bang = nullable(f) ? "!" : "";
    return `    _${f.name}.text = i?.${f.name} == null ? '' : (i!.${f.name}${bang}.minorUnits / 100).toStringAsFixed(2);`;
  }
  switch (f.type) {
    case "String": return `    _${f.name}.text = i?.${f.name} ?? '';`;
    case "int": case "double": return `    _${f.name}.text = i?.${f.name}${chain}toString() ?? '';`;
    // G2: stored as yyyy-MM-dd (matches what showDatePicker writes below) — not the full
    // toIso8601String() timestamp, so the displayed text always matches the picker's own format.
    case "DateTime": return `    _${f.name}.text = i?.${f.name} == null ? '' : i!.${f.name}${nullable(f) ? "!" : ""}.toIso8601String().split('T').first;`;
    case "bool": case "enum": return `    if (i != null) _${f.name} = i.${f.name};`;
    default: return null;
  }
}

function fieldWidget(f: Field, roleCtx?: FieldRoleContext): string {
  const label = fieldLabel(f.name);
  // P7-L1: same decimal-text UI as "double", plus a currency suffix; the typed value is parsed
  // into minor units in valueExpr(), never left as a raw double.
  if (isMoneyField(f)) {
    return `        TextField(controller: _${f.name}, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '${label}', suffixText: '${f.currency}')),`;
  }
  switch (f.type) {
    case "String":
      return `        TextField(controller: _${f.name}, decoration: const InputDecoration(labelText: '${label}')),`;
    case "int":
      return `        TextField(controller: _${f.name}, keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '${label}')),`;
    case "double":
      return `        TextField(controller: _${f.name}, keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '${label}')),`;
    // G2: a real date picker, not free-typed text — read-only so the on-screen keyboard never
    // opens; onTap drives showDatePicker and writes the pick back into the same controller (still
    // yyyy-MM-dd), so valueExpr()'s DateTime.tryParse(_<f>.text) keeps working unchanged.
    case "DateTime":
      return `        TextField(controller: _${f.name}, readOnly: true, decoration: const InputDecoration(labelText: '${label}', hintText: 'YYYY-MM-DD'), onTap: () async {
          final picked = await showDatePicker(context: context, initialDate: DateTime.tryParse(_${f.name}.text) ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
          if (picked != null) setState(() => _${f.name}.text = picked.toIso8601String().split('T').first);
        }),`;
    case "bool":
      return `        CheckboxListTile(title: const Text('${label}'), value: _${f.name}, onChanged: (v) => setState(() => _${f.name} = v ?? false)),`;
    case "enum": {
      const enumType = f.of ?? capitalize(f.name);
      // UIX Slice D: status/priority enums get a ChoiceChip row (segmented, tone-colored via the
      // same AppChip.toneFor* mapping Slice C's read-only chips use) instead of a raw
      // DropdownButton overlay — the owner's UI/UX complaint was specifically about that overlay.
      // Every other enum keeps the dropdown unchanged (role fallback = "plain", not this branch).
      const role = fieldRole(f, roleCtx);
      if (role === "status" || role === "priority") {
        const toneFn = role === "status" ? "toneForStatus" : "toneForPriority";
        return `        Wrap(spacing: AppSpacing.sm, children: ${enumType}.values.map((v) => ChoiceChip(label: Text(v.name), selected: _${f.name} == v, selectedColor: AppChip.colorForTone(context, AppChip.${toneFn}(v.name)).withValues(alpha: 0.2), onSelected: (_) => setState(() => _${f.name} = v))).toList()),`;
      }
      return `        DropdownButton<${enumType}>(value: _${f.name}, items: ${enumType}.values.map((v) => DropdownMenuItem(value: v, child: Text(v.name))).toList(), onChanged: (v) => setState(() => _${f.name} = v ?? _${f.name})),`;
    }
    default:
      return "";
  }
}

function valueExpr(f: Field): string {
  const opt = nullable(f);
  // P7-L1: decimal text -> minor units (round, never truncate) -> Money, never a raw double.
  if (isMoneyField(f)) {
    const money = `Money(minorUnits: ((double.tryParse(_${f.name}.text) ?? 0.0) * 100).round(), currency: '${f.currency}')`;
    return opt ? `(_${f.name}.text.isEmpty ? null : ${money})` : money;
  }
  switch (f.type) {
    case "String": return opt ? `(_${f.name}.text.isEmpty ? null : _${f.name}.text)` : `_${f.name}.text`;
    case "int": return opt ? `int.tryParse(_${f.name}.text)` : `(int.tryParse(_${f.name}.text) ?? 0)`;
    case "double": return opt ? `double.tryParse(_${f.name}.text)` : `(double.tryParse(_${f.name}.text) ?? 0.0)`;
    case "DateTime": return opt ? `(_${f.name}.text.isEmpty ? null : DateTime.tryParse(_${f.name}.text))` : `(DateTime.tryParse(_${f.name}.text) ?? DateTime.now())`;
    default: return `_${f.name}`; // bool | enum
  }
}

// Reference/List fields aren't form-edited: carry the value forward from the record being
// edited, else fall back to its IR default (or a neutral sample literal as a last resort).
function carryForwardExpr(f: Field): string {
  if (nullable(f)) return `widget.initial?.${f.name}`;
  if (hasDefault(f)) return `widget.initial?.${f.name} ?? ${defaultValue(f)}`;
  return `widget.initial?.${f.name} ?? ${sampleArgFor(f, [], [])}`;
}

export function generateCrudFormScreen(target: CrudFormTarget, entity: EntityModel, screenName: string, ctx?: GenContext): string {
  const identityField = entity.identity?.field ?? "id";
  const identityFieldDef = entity.fields.find((f) => f.name === identityField);
  const identityType = identityFieldDef ? (identityFieldDef.semanticType ?? identityFieldDef.type) : "String";
  const editable = crudEditableFields(entity, identityField);
  const editableNames = new Set(editable.map((f) => f.name));
  const carried = entity.fields.filter((f) => f.name !== identityField && !editableNames.has(f.name));

  const collection = collectionField(target.entity);
  const sm = ctx?.sm ?? "bloc";
  const stateModel = (ctx?.ir?.states ?? []).find((s: any) => s.entity === target.entity);
  const stateName = stateModel?.name ?? target.screen.state;
  const hasDetail = (ctx?.ir?.screens ?? []).some((s: any) => s.entity === target.entity && s.type === "detail");
  const listPath = `/${kebab(target.entity)}`;
  const postSubmitPath = hasDetail ? `${listPath}/\${item.${identityField}}` : listPath;

  const bodyClass = `_${screenName}Body`;

  const roleCtx: FieldRoleContext = {
    identityField,
    entityNames: ((ctx?.ir?.entities ?? []) as Array<{ name: string }>).map((e) => e.name),
  };

  const controllerFields = editable.filter(usesController).map(controllerDecl).join("\n");
  const stateFields = editable.filter((f) => !usesController(f)).map(stateVarDecl).join("\n");
  const initLines = editable.map(initStateLine).filter((l): l is string => !!l).join("\n");
  const disposeLines = editable.filter(usesController).map((f) => `    _${f.name}.dispose();`).join("\n");
  const fieldWidgets = editable.map((f) => fieldWidget(f, roleCtx)).join("\n");

  const ctorArgs = [
    `        ${identityField}: widget.id ?? ${newIdExpr(identityType)},`,
    ...editable.map((f) => `        ${f.name}: ${valueExpr(f)},`),
    ...carried.map((f) => `        ${f.name}: ${carryForwardExpr(f)},`),
  ].join("\n");

  const body = `class ${bodyClass} extends StatefulWidget {
  const ${bodyClass}({super.key, required this.initial, required this.id, required this.onSubmit});
  final ${entity.name}? initial;
  final String? id;
  final Future<void> Function(${entity.name}) onSubmit;

  @override
  State<${bodyClass}> createState() => _${screenName}BodyState();
}

class _${screenName}BodyState extends State<${bodyClass}> {
${controllerFields}
${stateFields}

  @override
  void initState() {
    super.initState();
    final i = widget.initial;
${initLines}
  }

  @override
  void dispose() {
${disposeLines}
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
${fieldWidgets}
          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: () async {
              final item = ${entity.name}(
${ctorArgs}
              );
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
              if (context.mounted) context.go('${postSubmitPath}');
            },
          ),
        ],
      ),
    );
  }
}`;

  const findInitial = `state.${collection}.where((e) => e.${identityField} == id)`;

  const screenWidget = sm === "riverpod"
    ? `class ${screenName} extends ConsumerWidget {
  const ${screenName}({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final id = GoRouterState.of(context).pathParameters['id'];
    final state = ref.watch(${camelize(stateName)}Provider);
    final matches = ${findInitial};
    final initial = id == null || matches.isEmpty ? null : matches.first;
    final notifier = ref.read(${camelize(stateName)}Provider.notifier);
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New ${target.entity}' : 'Edit ${target.entity}')),
      body: ${bodyClass}(
        key: ValueKey(id ?? 'new'),
        initial: initial,
        id: id,
        onSubmit: (item) => id == null ? notifier.create(item) : notifier.update(item),
      ),
    );
  }
}`
    : `class ${screenName} extends StatelessWidget {
  const ${screenName}({super.key});

  @override
  Widget build(BuildContext context) {
    final id = GoRouterState.of(context).pathParameters['id'];
    return Scaffold(
      appBar: AppBar(title: Text(id == null ? 'New ${target.entity}' : 'Edit ${target.entity}')),
      body: BlocBuilder<${stateName}Cubit, ${stateName}State>(
        builder: (context, state) {
          final matches = ${findInitial};
          final initial = id == null || matches.isEmpty ? null : matches.first;
          return ${bodyClass}(
            key: ValueKey(id ?? 'new'),
            initial: initial,
            id: id,
            onSubmit: (item) => id == null
                ? context.read<${stateName}Cubit>().create(item)
                : context.read<${stateName}Cubit>().update(item),
          );
        },
      ),
    );
  }
}`;

  const stateLibImport = sm === "riverpod"
    ? `import 'package:flutter_riverpod/flutter_riverpod.dart';`
    : `import 'package:flutter_bloc/flutter_bloc.dart';`;
  const stateImport = ctx?.symbols.get(stateName)
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get(stateName)}';`
    : `import '${stateName.toLowerCase()}.dart';`;
  const componentsImport = ctx ? `import 'package:${ctx.pkg}/core/components.dart';` : "import '../../core/components.dart';";
  const themeImport = ctx ? `import 'package:${ctx.pkg}/core/theme.dart';` : "import '../../core/theme.dart';";

  // Entity + any enum field types referenced by the form (editable enum fields, and any carried
  // field whose type is an enum) — the entity's own import was missing until this fix (F2 review).
  const refTypes: string[] = [entity.name];
  for (const f of entity.fields) {
    if (f.name === identityField) continue;
    if (f.semanticType) refTypes.push(f.semanticType);
    else if (f.type === "enum") refTypes.push(f.of || capitalize(f.name));
  }
  const typeImports = importsFromTypes(refTypes, ctx).join("\n");

  return `// [generated] generator=CrudFormGenerator template=crud_form_${sm}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
${stateLibImport}
${componentsImport}
${themeImport}
${stateImport}
${typeImports}

${screenWidget}

${body}
`;
}
