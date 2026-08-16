import { EntityModel, Field, RuleModel } from "../types";
import { GenContext, nullable, hasDefault, defaultValue, sampleArgFor, fieldLabel, kebab, collectionField, capitalize, camelize, importsFromTypes, newIdExpr } from "../dart";
import { CrudFormTarget, isMoneyField, crudEditableFields, fieldRole, FieldRoleContext, firstFocusBypassField, policyRulesForEntity, splitGroupFor, SplitGroup, hasTenantScoping } from "../operations";

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

function focusNodeDecl(f: Field): string {
  return `  final _${f.name}Focus = FocusNode();`;
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

function initStateLine(f: Field, roleCtx?: FieldRoleContext, scopedEntity?: boolean): string | null {
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
    case "String": {
      // G6 (relationship prefill): a `<Parent>Id` field reached via a child-list FAB that carried
      // `?<parent>Id=<id>` forward (screen.ts) prefills from that query param on CREATE — `i` is
      // always null there, so `i?.${f.name}` is null and the query param wins; on EDIT `i`'s own
      // value always wins regardless, since `widget.queryParams` is empty coming from the edit
      // route. Every other String field is unaffected (blank on create, exactly as before).
      const isRelation = fieldRole(f, roleCtx) === "relation";
      // MF2: a tenant-scoped entity's `tenantId` pre-fills from the signed-in session on CREATE.
      // The repository still re-stamps it from Session on create/update regardless — this prefill
      // is a UX default (the field is visible and editable), never the security boundary.
      if (f.name === "tenantId" && scopedEntity) {
        return `    _${f.name}.text = i?.${f.name} ?? Session.instance.tenantId ?? '';`;
      }
      return isRelation
        ? `    _${f.name}.text = i?.${f.name} ?? widget.queryParams['${f.name}'] ?? '';`
        : `    _${f.name}.text = i?.${f.name} ?? '';`;
    }
    case "int": case "double": return `    _${f.name}.text = i?.${f.name}${chain}toString() ?? '';`;
    // G2: stored as yyyy-MM-dd (matches what showDatePicker writes below) — not the full
    // toIso8601String() timestamp, so the displayed text always matches the picker's own format.
    case "DateTime": return `    _${f.name}.text = i?.${f.name} == null ? '' : i!.${f.name}${nullable(f) ? "!" : ""}.toIso8601String().split('T').first;`;
    case "bool": case "enum": return `    if (i != null) _${f.name} = i.${f.name};`;
    default: return null;
  }
}

// Keyboard bypass for iOS Safari (create AND edit — supersedes RCA-005's autofocus-only fix,
// which the owner confirmed was still not enough on a real device). RCA-005's diagnosis
// (create's DOM `<input>` proxy doesn't exist until the first tap) was real but incomplete:
// `autofocus` requests focus PROGRAMMATICALLY, not from a user gesture — iOS Safari doesn't
// count that as a gesture, and once the field already reports itself as focused, Flutter's own
// focus manager can treat the user's SUBSEQUENT real tap as a no-op (nothing changed) and never
// re-issue the platform-level `.focus()` call the tap would otherwise trigger. Net effect:
// autofocus can make the real bug WORSE, not better.
//
// Fix: remove autofocus entirely. The first real (non-readOnly) text field instead gets an
// explicit `FocusNode` plus `onTap: () => node.requestFocus()` — a call WE control, fired
// synchronously inside the tap's own gesture handler, exactly what iOS requires. Because the
// field starts genuinely unfocused (no autofocus), this tap is always a real focus transition,
// never a no-op — it drives both the DOM proxy creation AND the gesture-bound `.focus()` in one
// synchronous step. Applies to both create and edit now (autofocus was create-only via
// `widget.id == null`; this bypass doesn't need that guard — it only ever fires from an actual
// tap, so there's no "stealing focus on mount" risk to avoid on edit).
//
// Rejected alternatives (RCA style):
// - Keep autofocus AND add the tap-driven request: doesn't remove the actual suspect (autofocus
//   itself), and the "already focused, tap is a no-op" failure mode would still apply on the
//   very first tap after mount.
// - A form-wide first-tap "priming" gesture (wrap the whole form, focus field 1 on ANY first
//   tap): surprising UX — tapping field 2 first would silently steal focus into field 1 instead
//   of focusing field 2. Rejected in favor of a per-field, gesture-accurate handler.
// - `TextInput.finishAutofillContext()`-style hacks: unrelated to this failure mode (that API
//   addresses autofill session cleanup, not focus/keyboard triggering) — evaluated and dropped.
function fieldWidget(f: Field, roleCtx?: FieldRoleContext, focusBypassTarget?: boolean, policyTriggerField?: boolean): string {
  const label = fieldLabel(f.name);
  const focusBypass = focusBypassTarget ? `focusNode: _${f.name}Focus, onTap: () => _${f.name}Focus.requestFocus(), ` : "";
  // L2: a controller-backed TextField (String/int/double/Money — enum/bool/DateTime already call
  // setState on change via their own onSelected/onChanged/onTap) has no listener by default, so a
  // policy rule that reads this field would compute against a stale value until some UNRELATED
  // rebuild happened — "verdicts before submit" needs live recompute as the user types. Only
  // added for fields a policy rule's condition actually reads (policyRuleTriggerFields in
  // generateCrudFormScreen), so every other field's output is untouched.
  const policyOnChanged = policyTriggerField ? "onChanged: (_) => setState(() {}), " : "";
  // P7-L1: same decimal-text UI as "double", plus a currency suffix; the typed value is parsed
  // into minor units in valueExpr(), never left as a raw double.
  if (isMoneyField(f)) {
    return `        TextField(controller: _${f.name}, ${focusBypass}${policyOnChanged}keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '${label}', suffixText: '${f.currency}')),`;
  }
  switch (f.type) {
    case "String":
      return `        TextField(controller: _${f.name}, ${focusBypass}${policyOnChanged}decoration: const InputDecoration(labelText: '${label}')),`;
    case "int":
      return `        TextField(controller: _${f.name}, ${focusBypass}${policyOnChanged}keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '${label}')),`;
    case "double":
      return `        TextField(controller: _${f.name}, ${focusBypass}${policyOnChanged}keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '${label}')),`;
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

// L2: when the entity has >=1 severity'd rule (operations.ts's policyRulesForEntity — the single
// source of truth shared with index.ts/symbols.ts/test.ts so this can never drift from which
// entities actually get a generated evaluate<Entity>Policy()), the create/edit form shows the
// verdicts inline BEFORE submit — the owner's "employee sees plain-language reasons before
// submit" requirement — gates Save on any unwaived `block`, and requires a non-empty
// justification for any unwaived `requireJustification` verdict. All of it is empty-string when
// the entity has no policy rules, so every entity untouched by L2 gets byte-identical output to
// before this feature existed (the whole backward-compat story for this generator).
function policyWiring(entity: EntityModel, policyRules: RuleModel[], ctorArgs: string, ctx?: GenContext) {
  if (!policyRules.length) {
    return { imports: "", stateFields: "", disposeLines: "", methods: "", panelCall: "", itemExpr: `${entity.name}(\n${ctorArgs}\n              )`, saveGuard: "" };
  }

  const policyImport = ctx?.symbols.get("PolicyVerdict")
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get("PolicyVerdict")}';`
    : `import '../../core/policy.dart';`;
  const engineImport = ctx?.symbols.get(`evaluate${entity.name}Policy`)
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get(`evaluate${entity.name}Policy`)}';`
    : `import '../../domain/policy/${entity.name.toLowerCase()}_policy.dart';`;
  const imports = `${policyImport}\n${engineImport}`;

  const stateFields = `  final Map<String, TextEditingController> _waiveReasonControllers = {};
  final Map<String, PolicyVerdict> _waivedVerdicts = {};
  final _policyJustification = TextEditingController();`;

  const disposeLines = `    for (final c in _waiveReasonControllers.values) {
      c.dispose();
    }
    _policyJustification.dispose();`;

  const methods = `
  TextEditingController _waiveController(String ruleId) =>
      _waiveReasonControllers.putIfAbsent(ruleId, () => TextEditingController());

  ${entity.name} _draft() => ${entity.name}(
${ctorArgs}
      );

  List<PolicyVerdict> _verdicts() => evaluate${entity.name}Policy(_draft())
      .map((v) => _waivedVerdicts[v.ruleId] ?? v)
      .toList();

  Widget _policyPanel() {
    final visible = _verdicts().where((v) => v.severity != PolicySeverity.autoApprove).toList();
    if (visible.isEmpty) return const SizedBox.shrink();
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        for (final v in visible)
          Card(
            color: v.isWaived
                ? Colors.grey.shade200
                : v.severity == PolicySeverity.block
                    ? Colors.red.shade50
                    : v.severity == PolicySeverity.warn
                        ? Colors.amber.shade50
                        : Colors.blue.shade50,
            child: Padding(
              padding: const EdgeInsets.all(AppSpacing.sm),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(v.isWaived ? '\${v.message} (waived)' : v.message),
                  if (v.requiresJustification) ...[
                    const SizedBox(height: AppSpacing.xs),
                    TextField(
                      controller: _policyJustification,
                      decoration: const InputDecoration(labelText: 'Justification'),
                      onChanged: (_) => setState(() {}),
                    ),
                  ],
                  if (!v.isWaived) ...[
                    const SizedBox(height: AppSpacing.xs),
                    TextField(
                      controller: _waiveController(v.ruleId),
                      decoration: const InputDecoration(labelText: 'Waive reason'),
                      onChanged: (_) => setState(() {}),
                    ),
                    TextButton(
                      onPressed: _waiveController(v.ruleId).text.trim().isEmpty
                          ? null
                          : () => setState(() {
                                _waivedVerdicts[v.ruleId] = v.waive(
                                  waivedBy: 'current_user',
                                  waivedReason: _waiveController(v.ruleId).text,
                                );
                              }),
                      child: const Text('Waive'),
                    ),
                  ],
                ],
              ),
            ),
          ),
      ],
    );
  }
`;

  const panelCall = `          _policyPanel(),\n`;
  const saveGuard = `_verdicts().any((v) => v.blocksAdvance || (v.requiresJustification && _policyJustification.text.trim().isEmpty))\n                ? null\n                : `;

  return { imports, stateFields, disposeLines, methods, panelCall, itemExpr: "_draft()", saveGuard };
}

// MF4: split/allocation section on the parent's own create/edit form (operations.ts's own doc
// comment covers the inference rule). Mirrors policyWiring's shape (empty-string everywhere when
// the entity has no split group — zero-diff backward compat) with two additions of its own:
// `initLines` (prefill on edit, spliced into initState right after the entity's own fields) and
// `submitHook` (persists the split rows right after the parent's own onSubmit — see the
// composed onPressed template below). Split rows are edited entirely as local widget state and
// persisted through the split child's OWN generated Cubit (context.read<...Cubit>() — the exact
// same call shape crud_form.ts already uses for the parent entity itself), never a raw
// repository/use-case call: the split child deliberately has no `screens` entry, but it keeps a
// `states` entry precisely so this reuses the existing Cubit/CRUD machinery instead of inventing
// a second, parallel way to talk to a repository. "Replace all" is the persistence strategy on
// save (delete every existing row for this parent, recreate the current rows) — deliberately not
// a diff/reconcile against the previous set, since the row count is small and rows carry no
// identity the user would recognize across edits; documented as the simple, deterministic choice.
// Bloc-only for this iteration (mirrors the state read/mutate calls the rest of this generator
// already makes) — no current sample combines riverpod with a split group, so the riverpod path
// is a documented gap, not silently wrong output.
function splitWiring(entity: EntityModel, ctx?: GenContext) {
  const empty = { imports: "", stateFields: "", initLines: "", disposeLines: "", methods: "", panelCall: "", saveGuard: "", submitHook: "" };
  if (!ctx?.ir || ctx.sm === "riverpod") return empty;
  const group: SplitGroup | undefined = splitGroupFor(entity.name, ctx.ir);
  if (!group) return empty;
  const splitState = (ctx.ir.states ?? []).find((s: any) => s.entity === group.child);
  if (!splitState) return empty;

  const splitStateName = splitState.name;
  const splitCubit = `${splitStateName}Cubit`;
  const collection = collectionField(group.child);
  const childEntityDef = ctx.ir.entities.find((e: any) => e.name === group.child) as EntityModel | undefined;
  const childIdentityField = childEntityDef?.identity?.field ?? "id";
  const parentIdentityField = entity.identity?.field ?? "id";
  const categoryField = group.categoryField ?? "category";

  const stateImport = ctx.symbols.get(splitStateName)
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get(splitStateName)}';`
    : `import '../state/${splitStateName.toLowerCase()}.dart';`;
  const childEntityImport = ctx.symbols.get(group.child)
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get(group.child)}';`
    : `import '../../domain/entities/${group.child.toLowerCase()}.dart';`;
  const splitCoreImport = ctx.symbols.get("SplitLine")
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get("SplitLine")}';`
    : `import '../../core/split.dart';`;
  const imports = `${stateImport}\n${childEntityImport}\n${splitCoreImport}`;

  const stateFields = `  final List<SplitRowControllers> _splitRows = [];`;

  const initLines = `    if (widget.id != null) {
      for (final s in context.read<${splitCubit}>().state.${collection}.where((s) => s.${group.fkField} == widget.id)) {
        _splitRows.add(SplitRowControllers(category: s.${categoryField}, percent: s.percent.toString()));
      }
    }`;

  const disposeLines = `    for (final r in _splitRows) {
      r.dispose();
    }`;

  const methods = `
  void _addSplitRow() => setState(() => _splitRows.add(SplitRowControllers()));

  void _removeSplitRow(int i) => setState(() {
        _splitRows[i].dispose();
        _splitRows.removeAt(i);
      });

  List<SplitLine> _splitLines() => _splitRows
      .map((r) => SplitLine(category: r.category.text, percent: double.tryParse(r.percent.text) ?? 0))
      .toList();

  double get _splitTotal => _splitLines().fold<double>(0, (s, l) => s + l.percent);

  Widget _splitSection() {
    final errors = validateSplit(_splitLines());
    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        Text('Split', style: Theme.of(context).textTheme.titleMedium),
        for (var i = 0; i < _splitRows.length; i++)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _splitRows[i].category,
                    decoration: const InputDecoration(labelText: 'Category'),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                SizedBox(
                  width: 96,
                  child: TextField(
                    controller: _splitRows[i].percent,
                    decoration: const InputDecoration(labelText: '%'),
                    keyboardType: const TextInputType.numberWithOptions(decimal: true),
                    onChanged: (_) => setState(() {}),
                  ),
                ),
                IconButton(icon: const Icon(Icons.remove_circle_outline), onPressed: () => _removeSplitRow(i)),
              ],
            ),
          ),
        TextButton.icon(onPressed: _addSplitRow, icon: const Icon(Icons.add), label: const Text('Add split')),
        Text(
          'Split total: \${_splitTotal.toStringAsFixed(2)}%',
          style: TextStyle(color: errors.isEmpty ? null : Colors.red, fontWeight: FontWeight.bold),
        ),
        for (final e in errors) Text(e, style: const TextStyle(color: Colors.red)),
      ],
    );
  }
`;

  const panelCall = `          _splitSection(),\n`;
  const saveGuard = `validateSplit(_splitLines()).isNotEmpty\n                ? null\n                : `;
  const submitHook = `              {
                final existingSplits = context.read<${splitCubit}>().state.${collection}.where((e) => e.${group.fkField} == item.${parentIdentityField}).toList();
                for (final e in existingSplits) {
                  await context.read<${splitCubit}>().delete(e.${childIdentityField});
                }
                for (var i = 0; i < _splitLines().length; i++) {
                  final line = _splitLines()[i];
                  await context.read<${splitCubit}>().create(${group.child}(
                    ${childIdentityField}: '\${item.${parentIdentityField}}-split-\$i',
                    ${group.fkField}: item.${parentIdentityField},
                    ${categoryField}: line.category,
                    percent: line.percent,
                  ));
                }
              }
`;

  return { imports, stateFields, initLines, disposeLines, methods, panelCall, saveGuard, submitHook };
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

  // Keyboard bypass target (create AND edit — see fieldWidget's own doc comment for why).
  const firstFocusable = firstFocusBypassField(entity, identityField);
  // G6: only entities that actually carry a `<Parent>Id` field need the `queryParams` plumbing at
  // all — everything else stays exactly as before (no unused widget field, no dead parameter).
  const relationFields = editable.filter((f) => fieldRole(f, roleCtx) === "relation");
  const hasRelation = relationFields.length > 0;
  // MF2: a tenant-scoped entity's tenantId field pre-fills from the signed-in session on create
  // (initStateLine's tenantId branch) and the form imports core/session.dart.
  const scopedEntity = ctx?.ir ? hasTenantScoping(ctx.ir, target.entity) : false;

  const controllerFields = editable.filter(usesController).map(controllerDecl).join("\n");
  const stateFields = editable.filter((f) => !usesController(f)).map(stateVarDecl).join("\n");
  const focusNodeField = firstFocusable ? focusNodeDecl(firstFocusable) : "";
  const initLines = editable.map((f) => initStateLine(f, roleCtx, scopedEntity)).filter((l): l is string => !!l).join("\n");
  const disposeLines = [
    ...editable.filter(usesController).map((f) => `    _${f.name}.dispose();`),
    ...(firstFocusable ? [`    _${firstFocusable.name}Focus.dispose();`] : []),
  ].join("\n");

  // L2: fields a policy rule's condition actually reads need a live setState on change (see
  // fieldWidget's own doc comment) so verdicts recompute as the user types, before Save.
  const policyRules = ctx?.ir ? policyRulesForEntity(ctx.ir, target.entity) : [];
  const policyTriggerFieldNames = new Set(policyRules.flatMap((r) => r.conditions.map((c) => c.field)));

  const fieldWidgets = editable.map((f) => fieldWidget(f, roleCtx, f === firstFocusable, policyTriggerFieldNames.has(f.name))).join("\n");

  const ctorArgs = [
    `        ${identityField}: widget.id ?? ${newIdExpr(identityType)},`,
    ...editable.map((f) => `        ${f.name}: ${valueExpr(f)},`),
    ...carried.map((f) => `        ${f.name}: ${carryForwardExpr(f)},`),
  ].join("\n");

  // L2: policy verdicts inline on the form — see policyWiring()'s own doc comment. Empty for any
  // entity with no severity'd rules (the common case, and every currently-committed sample except
  // the ones this feature's own proof adds).
  const policy = policyWiring(entity, policyRules, ctorArgs, ctx);
  // MF4: split section inline on the form — see splitWiring()'s own doc comment. Empty for any
  // entity with no split group.
  const split = splitWiring(entity, ctx);

  const queryParamsCtorArg = hasRelation ? ", required this.queryParams" : "";
  const queryParamsField = hasRelation ? "  final Map<String, String> queryParams;\n" : "";

  const body = `class ${bodyClass} extends StatefulWidget {
  const ${bodyClass}({super.key, required this.initial, required this.id${queryParamsCtorArg}, required this.onSubmit});
  final ${entity.name}? initial;
  final String? id;
${queryParamsField}  final Future<void> Function(${entity.name}) onSubmit;

  @override
  State<${bodyClass}> createState() => _${screenName}BodyState();
}

class _${screenName}BodyState extends State<${bodyClass}> {
${controllerFields}
${stateFields}
${focusNodeField}
${policy.stateFields}
${split.stateFields}

  @override
  void initState() {
    super.initState();
    final i = widget.initial;
${initLines}
${split.initLines}
  }

  @override
  void dispose() {
${disposeLines}
${policy.disposeLines}
${split.disposeLines}
    super.dispose();
  }
${policy.methods}${split.methods}
  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(AppSpacing.md),
      child: ListView(
        children: [
${fieldWidgets}
${policy.panelCall}${split.panelCall}          const SizedBox(height: AppSpacing.md),
          PrimaryButton(
            label: widget.id == null ? 'Create' : 'Save',
            onPressed: ${policy.saveGuard}${split.saveGuard}() async {
              final item = ${policy.itemExpr};
              // Await the mutation before navigating — otherwise the detail/list screen we're
              // about to navigate to can render one frame ahead of the state update (race).
              await widget.onSubmit(item);
${split.submitHook}              if (context.mounted) context.go('${postSubmitPath}');
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
${hasRelation ? "        queryParams: GoRouterState.of(context).uri.queryParameters,\n" : ""}        onSubmit: (item) => id == null ? notifier.create(item) : notifier.update(item),
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
${hasRelation ? "            queryParams: GoRouterState.of(context).uri.queryParameters,\n" : ""}            onSubmit: (item) => id == null
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
  // MF2: the tenant-aware initStateLine above writes `Session.instance.tenantId` literally —
  // resolve the Session import the same way every other generated type reference is resolved.
  if (scopedEntity) refTypes.push("Session");
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
${policy.imports}
${split.imports}

${screenWidget}

${body}
`;
}
