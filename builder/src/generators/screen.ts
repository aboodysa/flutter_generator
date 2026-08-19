import { ScreenModel, EntityModel, Field, WizardStep, SectionModel } from "../types";
import { GenContext, nullable, kebab, collectionField, fieldLabel, camelize, capitalize, entityPluralTitle, importsFromTypes } from "../dart";
import { compositionFor, ActionKind, ActionSpec } from "../composition";
import { crudFormTargets, stepFields, wizardTextInputFields, isMoneyField, fieldRole, FieldRole, FieldRoleContext, splitGroupFor, resolveBudget, resolveExport, exportableFields, hasLocale, quickDecisionTargets } from "../operations";

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

// UIX Slice C: the FieldRoleContext (identity field + every known entity name, for "relation"/FK
// detection) is the same for every field of a given entity — computed once per screen instead of
// re-deriving it per field.
function roleContextFor(entity: EntityModel, ctx?: GenContext): FieldRoleContext {
  return {
    identityField: entity.identity?.field ?? "id",
    entityNames: ((ctx?.ir?.entities ?? []) as Array<{ name: string }>).map((e) => e.name),
  };
}

// A status/priority enum field rendered as a tone-colored AppChip/AppStatusDot — both the detail
// chip row and the list-row leading glyph consume the same value+tone expression (fieldValue()
// already handles a nullable enum's `?.name ?? '—'` fallback, so the chip never crashes on null,
// it just renders the neutral/info default tone for that fallback text).
// D2#4 (SPIKE_S6_REPORT.md §16 item-gap decision): AppSpacing's own scale, keyed by its logical-px
// value — every COMPOSITIONS heroGap/itemGap constant lands on one of these exactly, so routing
// through it is a token-name swap, not a value change (composition.ts's own values stay the
// source of truth; this only changes how they're EMITTED).
const SPACING_SCALE: Record<number, string> = { 4: "AppSpacing.xs", 8: "AppSpacing.sm", 16: "AppSpacing.md", 24: "AppSpacing.lg", 40: "AppSpacing.xl" };
// Exported so validate.ts's [visualIntent] gate computes the SAME default-fallback token this
// file emits (rather than a second, independently-drifting reimplementation — the exact class of
// bug the S1 token-rigor pass found latent in the gate's old hero-padding marker).
export function spacingToken(px: number): string {
  return SPACING_SCALE[px] ?? `${px}.0`;
}

function chipToneExpr(field: Field, toneFn: "toneForStatus" | "toneForPriority"): { value: string; tone: string } {
  const value = fieldValue(field, "item");
  return { value, tone: `AppChip.${toneFn}(${value})` };
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
export function childLinks(entityName: string, entities: Array<{ name: string; fields?: Field[] }>): Array<{ child: string; fkField: string }> {
  const me = camelize(entityName);
  return entities
    .filter((e) => e.name !== entityName)
    .flatMap((e) => {
      const fk = e.fields?.find((f) => f.name === `${me}Id`);
      return fk ? [{ child: e.name, fkField: fk.name }] : [];
    });
}

// The `<Parent>Id` field marking this entity as a "child" reached via a parent's detail link (if
// any) — shared by listFilterExpr (row filtering) AND the create-FAB below (G6: the FAB must
// carry the SAME `?<fk>=<id>` forward into the create form so it can prefill the field), so both
// resolve the field once, never re-deriving the same `endsWith("Id")` heuristic independently.
// MF2: `tenantId` is excluded — it LOOKS like a `<Parent>Id` FK structurally but is the tenant
// boundary (a cross-cutting concern, not a navigation relationship). Treating it as a child FK
// would wrap the tenant scoping in query-param navigation semantics (child-list filtering + FAB
// `?tenantId=` forwarding) that fight repository_impl.ts's own session scoping.
function childForeignKey(entity: EntityModel | undefined): Field | undefined {
  return entity?.fields.find((f) => f.name.endsWith("Id") && f.name !== "id" && f.name !== "tenantId");
}

// Child list query-param filter: if this list screen's entity is a child (has `<Parent>Id` fields),
// a matching `?<fk>=<parentId>` query param (arrived via the parent's detail-screen link) restricts
// the visible rows to that parent's children. Null-safe (no param → no filter). Gated on the entity
// actually carrying the field so unrelated list screens stay unchanged.
function listFilterExpr(fk: Field | undefined, collection: string): string {
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
function wizardFieldInput(fieldName: string, field: Field | undefined, setterCall: (valueExpr: string) => string, roleCtx?: FieldRoleContext, focusBypassTarget?: boolean): string {
  const label = fieldLabel(fieldName);
  const key = `const ValueKey('field-${fieldName}')`;
  if (!field) return `Text('${label} — unknown field')`;
  // RCA-002-ALL: same gesture-bound FocusNode.requestFocus() bypass crud_form.ts wires for CRUD
  // text fields (never autofocus — see crud_form.ts's own doc comment for the full RCA), applied
  // to every wizard TextFormField (String/int/double/Money). The wizard is controller-less (see
  // file header comment), but a FocusNode is independent of TextEditingController — declared in
  // the screen's State, disposed alongside it.
  const focusBypass = focusBypassTarget ? `focusNode: _${fieldName}Focus, onTap: () => _${fieldName}Focus.requestFocus(), ` : "";
  // P7-L1: decimal text -> Money(minorUnits: ..., currency: ...), never a raw double state field.
  if (isMoneyField(field)) {
    const parse = `(v.isEmpty ? null : Money(minorUnits: ((double.tryParse(v) ?? 0.0) * 100).round(), currency: '${field.currency}'))`;
    return `TextFormField(key: ${key}, ${focusBypass}initialValue: state.${field.name} != null ? (state.${field.name}!.minorUnits / 100).toStringAsFixed(2) : '', keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '${label}', suffixText: '${field.currency}'), onChanged: (v) => ${setterCall(parse)})`;
  }
  switch (field.type) {
    case "String":
      return `TextFormField(key: ${key}, ${focusBypass}initialValue: state.${field.name} ?? '', decoration: const InputDecoration(labelText: '${label}'), onChanged: (v) => ${setterCall("v")})`;
    case "int":
      return `TextFormField(key: ${key}, ${focusBypass}initialValue: state.${field.name}?.toString() ?? '', keyboardType: TextInputType.number, decoration: const InputDecoration(labelText: '${label}'), onChanged: (v) => ${setterCall("int.tryParse(v)")})`;
    case "double":
      return `TextFormField(key: ${key}, ${focusBypass}initialValue: state.${field.name}?.toString() ?? '', keyboardType: const TextInputType.numberWithOptions(decimal: true), decoration: const InputDecoration(labelText: '${label}'), onChanged: (v) => ${setterCall("double.tryParse(v)")})`;
    // G2: a real date picker. The wizard's fields are deliberately controller-less (value lives
    // in wizard state, see file header comment) — so instead of a static per-field key, the key
    // embeds the current value, forcing Flutter to discard+recreate the field (fresh
    // `initialValue`) whenever a pick changes it; a static key across rebuilds would otherwise
    // leave the display stuck at whatever `initialValue` was on first build (TextFormField only
    // consumes `initialValue` at construction, never on update).
    case "DateTime": {
      const iso = `state.${field.name}?.toIso8601String().split('T').first ?? ''`;
      return `TextFormField(key: ValueKey('field-${fieldName}-\${${iso}}'), initialValue: ${iso}, readOnly: true, decoration: const InputDecoration(labelText: '${label}', hintText: 'YYYY-MM-DD'), onTap: () async {
        final picked = await showDatePicker(context: context, initialDate: state.${field.name} ?? DateTime.now(), firstDate: DateTime(1900), lastDate: DateTime(2100));
        if (picked != null) ${setterCall("picked")};
      })`;
    }
    case "bool":
      return `CheckboxListTile(key: ${key}, value: state.${field.name} ?? false, title: Text('${label}'), onChanged: (v) => ${setterCall("v")})`;
    // UIX Slice D: status/priority wizard fields get the same ChoiceChip treatment as the CRUD
    // form (single source of truth: fieldRole + AppChip.toneFor*) — every other enum keeps the
    // dropdown, unchanged. V1.1: "choice" (a genuine multiple-choice value, e.g. a quiz answer)
    // gets the same chip row with a NEUTRAL tone — see crud_form.ts's identical branch for why a
    // status/priority string-match tone would be meaningless here.
    case "enum": {
      const enumType = field.of ?? capitalize(field.name);
      const role = fieldRole(field, roleCtx);
      if (role === "status" || role === "priority" || role === "choice") {
        const toneExpr = role === "choice" ? "AppChipTone.neutral" : `AppChip.${role === "status" ? "toneForStatus" : "toneForPriority"}(v.name)`;
        return `Wrap(key: ${key}, spacing: AppSpacing.sm, children: ${enumType}.values.map((v) => ChoiceChip(label: Text(v.name), selected: state.${field.name} == v, selectedColor: AppChip.colorForTone(context, ${toneExpr}).withValues(alpha: 0.2), onSelected: (_) => ${setterCall("v")})).toList())`;
      }
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

  // S1 (SPIKE_S1_REPORT.md §14.3, D4 "one rule that cannot break"): the decided VisualSpec for
  // THIS screen (composition.ts's visualTargets, computed once per generateApp run) — consumed by
  // name only, deltas applied verbatim, never re-derived here (composition.ts is the single
  // owner). `undefined` (no visualStyle on this screen) makes every override below a no-op, so
  // this screen renders byte-identically to pre-S1 output.
  const visual = ctx?.visual?.get(s.name);
  const cardSurface = visual && visual.surfaceBias !== "inherit"
    ? visual.surfaceBias === "card"
    : comp.surface !== "plain"; // Dart bool literal driving AppListCard(card: ...)
  // hierarchy: heroScale 0/2 bias heroGap away from the archetype's own value; 1 ("balanced",
  // undeclared hierarchy) leaves comp.heroGap untouched — routed through the matching AppSpacing
  // token (D2#4, SPIKE_S6_REPORT.md §16 item-gap decision) rather than a raw literal: every
  // COMPOSITIONS heroGap/itemGap value already equals an AppSpacing step exactly, so this is
  // byte-identical at runtime (AppSpacing.lg === 24.0), zero golden churn. A future archetype
  // whose gap falls outside the scale still falls back to a raw literal — resilience preserved.
  const heroGapExpr = visual && visual.heroScale !== 1
    ? (visual.heroScale === 0 ? "AppSpacing.sm" : "AppSpacing.xl")
    : spacingToken(comp.heroGap);
  // FIX-3 (S1_TOKEN_RIGOR_BRIEF_CLAUDE.md): personality resolves a FULL spacing row — every
  // layout relationship this archetype has (screen padding, section gap, item gap, card inset,
  // FAB inset) derives from the SAME scale, not just the item gap. "" per field (no personality
  // declared) leaves that relationship untouched — same token-routing precedent heroGapExpr above
  // already established; every field individually byte-identical-when-unset.
  const itemGapExpr = visual && visual.spacing.itemGap ? visual.spacing.itemGap : spacingToken(comp.itemGap);
  const screenGapExpr = visual && visual.spacing.screen ? visual.spacing.screen : "AppSpacing.md";
  const sectionGapExpr = visual && visual.spacing.section ? visual.spacing.section : "AppSpacing.lg";
  const cardInsetArg = visual && visual.spacing.cardInset ? `, contentPadding: EdgeInsets.all(${visual.spacing.cardInset})` : "";
  const fabInsetExpr = visual && visual.spacing.fabInset ? visual.spacing.fabInset : "";
  // cornerRadius: passed to AppListCard's radius param (components.ts, S1-conditional); "" (no
  // cornerRadius declared) omits the argument, so AppListCard falls back to the app's CardTheme
  // default — same rendering as pre-S1.
  const radiusArg = visual && visual.radiusScale.surface ? `, radius: ${visual.radiusScale.surface}` : "";
  // FIX-1 (S1_TOKEN_RIGOR_BRIEF_CLAUDE.md): the search field and FAB were the two dominant
  // controls the cornerRadius rules never reached — both defaulted to Material's own stadium/
  // circle shape regardless of the decided scale, so "sharp" never actually looked sharp on the
  // loudest control. "" (no cornerRadius declared) omits the shape override entirely — byte-
  // identical to today's Material-default SearchBar/FAB shape.
  const searchShapeArg = visual && visual.radiusScale.search
    ? `, shape: WidgetStatePropertyAll(RoundedRectangleBorder(borderRadius: BorderRadius.circular(${visual.radiusScale.search})))`
    : "";
  const fabShapeArg = visual && visual.radiusScale.fab ? `, shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(${visual.radiusScale.fab}))` : "";

  // UIX Slice B: domain-aware app-bar title — "Tasks", "Task details", never the class name
  // "TaskListScreen". Same shape of title regardless of provider (bloc/riverpod share this text).
  const appBarTitle = comp.layout === "detail" ? `${fieldLabel(s.entity)} details` : entityPluralTitle(s.entity);
  // FIX-2/FIX-4: hierarchy's measurable typography effect lives on the AppBar title — the ONE
  // element every archetype always renders, and the literal element the review's "the Tasks
  // heading looks similar across A/B/C" complaint named. "" (heroScale balanced/undeclared) keeps
  // the title a `const Text(...)`, byte-identical to pre-fix output — the negative control that
  // heroScale=1 changes nothing.
  const titleWeight = visual?.titleWeight ?? "";
  const titleTextExpr = titleWeight
    ? `Text('${appBarTitle}', style: Theme.of(context).textTheme.titleLarge?.copyWith(fontWeight: ${titleWeight}))`
    : `const Text('${appBarTitle}')`;

  const entity = (ctx?.ir?.entities ?? []).find((e: any) => e.name === s.entity) as EntityModel | undefined;
  const identityField = entity?.identity?.field ?? "id";
  const childFk = childForeignKey(entity);

  // S2 (SPIKE_S2_REPORT.md §14.3): the decided SectionSpec for THIS screen (composition.ts's
  // sectionsTargets, computed once per generateApp run) — consumed by name only, never re-derived
  // here. Hoisted above the layout branch (rather than computed inside it) because the FAB decision
  // below (floatingCart) also needs it. `undefined` for any screen that declares no sections.
  const sectionsSpec = ctx?.sections?.get(s.name);
  const floatingCartSection = sectionsSpec?.sections.find((sec) => sec.type === "floatingCart") ?? sectionsSpec?.sections.flatMap((sec) => sec.children ?? []).find((c) => c.type === "floatingCart");
  const hasFloatingCart = !!floatingCartSection;
  // V1.1: a floatingCart section with a declared `target` route launches it instead of the
  // decorative "Add to cart" SnackBar — e.g. a quiz app's home FAB navigating to its wizard.
  // Absent `target` = today's cart FAB, byte-identical (every currently-committed sections screen).
  const fabTarget = floatingCartSection?.target;

  // P2 (contract §4): the decided SearchSpec for THIS screen (composition.ts's searchTargets,
  // computed once per generateApp run) — consumed by name only, never re-derived here. Bloc-only
  // this slice (same documented gap L3's export buttons already carry — no current sample pairs
  // riverpod with a searchable list, so the riverpod path stays byte-identical rather than
  // speculatively wired against nothing).
  const searchSpec = ctx?.search?.get(s.name);
  const searchEnabled = !!searchSpec && sm !== "riverpod";
  const searchField = searchEnabled ? entity!.fields.find((f) => f.name === searchSpec!.field) : undefined;

  // P3 (contract §5): the decided ScrollSpec for THIS screen (composition.ts's scrollTargets,
  // computed once per generateApp run) — consumed by name only, never re-derived here. State-
  // management AGNOSTIC on purpose (unlike search, the tint is pure presentation), so riverpod
  // list/detail screens get the listener too — no latent [scroll] gate gap.
  const scrollEnabled = !!ctx?.scroll?.get(s.name);

  // MF5: this screen's entity IS the resolved budget entity — both the list and detail branches
  // below construct a local `BudgetLine` from `item`'s limit/committed/actual fields when true.
  // No-op (resolvedBudget undefined, or entity name mismatch) for every screen this capability
  // doesn't touch — output byte-identical.
  const resolvedBudget = ctx?.ir ? resolveBudget(ctx.ir) : undefined;
  const isBudgetEntity = !!resolvedBudget && resolvedBudget.entity.name === s.entity;
  const budgetLineExpr = (item: string) =>
    `BudgetLine(scope: ${item}.${resolvedBudget!.scopeField?.name ?? identityField}, limit: ${item}.${resolvedBudget!.limitField.name}, committed: ${item}.${resolvedBudget!.committedField.name}, actual: ${item}.${resolvedBudget!.actualField.name})`;

  // L3: this screen's `export:` resolves against a real `exported: bool` field — see the export
  // button construction near appBarActions below. No-op for every screen this capability doesn't
  // touch (undeclared export, unresolved declaration, or a non-"list" screen type).
  const resolvedExport = ctx?.ir ? resolveExport(ctx.ir, s) : undefined;

  // L4: locale-aware — a small, FIXED chrome vocabulary (Back/Edit/Delete/noData/New) swaps
  // through AppStrings.of(context); per-entity/field labels stay as-is (documented scope
  // boundary, see infra.ts's generateLocaleAwareLocalization doc comment). `appStringsUsed`
  // tracks whether THIS screen actually calls str() anywhere — a read-only list screen with no
  // create/edit/delete/detail affordance never does, and importing AppStrings unconditionally
  // whenever the APP is locale-aware (rather than when THIS FILE needs it) produced an
  // unused_import warning on exactly those screens (caught by `flutter analyze`, not the
  // TS-level regression diff, since the import itself is still syntactically valid).
  const loc = !!ctx?.ir && hasLocale(ctx.ir);
  let appStringsUsed = false;
  const str = (key: string, literal: string) => {
    if (!loc) return literal;
    appStringsUsed = true;
    return `AppStrings.of(context).${key}`;
  };

  // §5.2-F1: create/edit/delete affordances, gated on what the entity's repository actually
  // supports (crudFormTargets is the single source shared with route.ts/index.ts/symbols.ts).
  const crudTarget = ctx?.ir ? crudFormTargets(ctx.ir).get(s.entity) : undefined;
  const canEditCreate = !!crudTarget;
  const canDelete = !!crudTarget?.delete;
  const hasDetailScreen = (ctx?.ir?.screens ?? []).some((sc: any) => sc.entity === s.entity && sc.type === "detail");
  // Dead-route guard: a list row only navigates when its entity has a detail screen OR a
  // create/edit form. Otherwise `context.push('/x/:id')` would hit a non-existent route →
  // go_router "Page Not Found" (walkthrough finding: inventory, ledgerly-auth). Used by the
  // list branch (onTap/trailing) AND the go_router import decision below.
  const listHasNavTarget = hasDetailScreen || canEditCreate;
  const formPath = `/${kebab(s.entity)}`;
  const readMutator = (method: string, args: string) =>
    sm === "riverpod" ? `ref.read(${camelize(s.state)}Provider.notifier).${method}(${args})` : `context.read<${s.state}Cubit>().${method}(${args})`;

  // P5/D2 Slice 2 (SPIKE_P5_D2_REPORT.md §14.1/§14.2): the decided StatePlacementSpec for THIS
  // screen (composition.ts's statePlacementTargets, computed once per generateApp run) — consumed
  // by name only, never re-derived here (contract §1: composition.ts is the single owner). No
  // entry (wizard: the flow-status field is `wizardStatus`, not `status`) emits none of the
  // triad's rendered pieces. Hoisted above the list/wizard/detail branch (rather than computed
  // just before `checks` below) because Slice 3's empty-state CTA and refresh also need it, and
  // both are decided inside the list branch, upstream of where `checks` is built.
  const placement = ctx?.states?.get(s.name);

  // G6: on a child list screen (reached via a parent's "View <Child>s" link, e.g. FollowUps under
  // a Task), the create-form nav must carry the SAME `?<fk>=<parentId>` query param forward —
  // otherwise "New FollowUp" from a filtered list loses which parent it belongs to, and
  // crud_form.ts's own query-param prefill never gets an id to prefill with. Shared by the FAB
  // (below) and Slice 3's empty-state "New <Entity>" CTA — both must navigate identically.
  const newFormOnPressed = childFk
    ? `() {\n          final id = GoRouterState.of(context).uri.queryParameters['${childFk.name}'];\n          context.push(id != null ? '${formPath}/new?${childFk.name}=\$id' : '${formPath}/new');\n        }`
    : `() => context.push('${formPath}/new')`;
  // L4: only the fixed "New" word is translatable — ${s.entity} is a dynamic, IR-derived name with
  // no deterministic Arabic source (see infra.ts's documented scope boundary). Shared by the FAB
  // tooltip and Slice 3's empty-state CTA button label.
  const newLabel = loc ? `'\${AppStrings.of(context).newLabel} ${s.entity}'` : `'New ${s.entity}'`;

  // Hero block: gated by the archetype (comp.hasHero) AND an IR-declared headline — an archetype
  // with hasHero:false never renders one even if `s.hero` is set, and vice versa. heroGap (the
  // registry's rhythm field) drives the padding below the hero.
  const hero = heroExpr(s);
  const heroBlock = comp.hasHero && hero
    ? `        Padding(
          padding: const EdgeInsets.fromLTRB(${screenGapExpr}, ${sectionGapExpr}, ${screenGapExpr}, ${heroGapExpr}),
          child: Text(${hero}, style: Theme.of(context).textTheme.headlineMedium),
        ),`
    : "";

  let body: string;
  let wizardTypeImports = ""; // enum types explicitly named in a wizard's field widgets (DropdownButton<Enum>) — screen.ts otherwise never writes a bare type name that needs its own import.
  let wizardFocusFields: Field[] = []; // RCA-002-ALL: this wizard's text-input step fields (String/int/double/Money) that need a per-field FocusNode bypass declared on the screen's State — empty for any non-wizard screen or a wizard with no text-input fields.
  let splitStateImport = ""; // MF4: the split child's Cubit/State import (see splitBlock below) — empty for any detail screen with no split group.
  // MF5: BudgetLine import — only when THIS screen's entity resolves to the app's budget entity.
  const budgetImport = isBudgetEntity
    ? (ctx?.symbols.get("BudgetLine")
        ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get("BudgetLine")}';`
        : "import '../../core/budget.dart';")
    : "";
  // L3: toCsv/toJson import — importsFromTypes only resolves capitalized type references, and
  // core/export.dart has none (both exported functions are lowercase), so this needs a manual
  // import line the same way budgetImport/splitStateImport do. Also imports the entity TYPE
  // itself — every other reference to `item` in this file is inferred (property access needs no
  // import), but the export button's stamping loop is the first place a list screen ever writes
  // the bare `${Entity}(...)` constructor, which Dart does require an import for. Leading "\n"
  // folded into each value (not a separate template line) so a non-export screen's import block
  // gains zero extra blank lines — the same byte-identical-when-unused guarantee every other
  // L3/MF5 hook keeps.
  const exportImport = resolvedExport && s.type === "list"
    ? "\n" +
      (ctx?.symbols.get("toCsv") ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get("toCsv")}';` : "import '../../core/export.dart';") +
      "\n" +
      (ctx?.symbols.get(resolvedExport.entity.name)
        ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(resolvedExport.entity.name)}';`
        : `import '../domain/entities/${resolvedExport.entity.name.toLowerCase()}.dart';`)
    : "";
  if (comp.layout === "sections") {
    // S2 (SPIKE_S2_REPORT.md §14.3): pure per-type mapping under a vertical ListView scroll
    // parent (the list branch's Expanded(child: ListView...) shape, :744-759) — NEVER re-derives
    // component selection/token mapping (composition.ts's sectionsFor is the single owner);
    // applies ctx.visual deltas verbatim, same as every other archetype above.
    //
    // S3 (SPIKE_S3_REPORT.md §14.4): the `hero`/`promoBanner`/`productGrid` cases below are the
    // verbatim application of composition.ts's decided AssetSpec (ctx.assets, via assetFor) — no
    // NEW lookup is needed here because AppHeroBanner/AppProductCard have no image-kind param to
    // thread in the first place: both are single-shape organisms (gradient-only, image-slot-free)
    // that already structurally implement the sole admitted kind for their role (D2), so emitting
    // `AppHeroBanner(`/`AppProductCard(` here IS the decision, byte-for-byte — never re-derived,
    // never parameterized past what the closed mapping table (composition.ts's ASSET_MAPPING)
    // already fixed. The `[assets]` gate re-derives assetFor independently and scans this file's
    // output for the same markers, so drift between the two is caught without a live dereference.
    const productRoleCtx = entity ? roleContextFor(entity, ctx) : undefined;
    const titleField = entity ? pickTitle(entity) : undefined;
    // Ordered by IR field-declaration order (never a hardcoded field name): the first money field
    // is the current price, the second (if any) is the struck-through "was" price — same
    // entity-agnostic, order-derived convention the detail branch's byRole() rendering uses.
    const moneyFields = entity ? entity.fields.filter(isMoneyField) : [];
    const priceField = moneyFields[0];
    const oldPriceField = moneyFields[1];
    const stockField = entity && productRoleCtx ? entity.fields.find((f) => fieldRole(f, productRoleCtx) === "status") : undefined;
    const productTitleExpr = titleField ? fieldValue(titleField, "item") : "item.toString()";
    const productPriceExpr = priceField ? fieldValue(priceField, "item") : "''";
    // fieldValue()'s nullable-safe convention (used for productPriceExpr above) coerces a null
    // money value to the STRING '—' — correct for a always-shown row value, wrong here: an unset
    // "was" price must stay Dart `null` (AppProductCard's `if (oldPrice != null)` check), never a
    // struck-through '—' rendered as if it were a real compare-at price.
    const productOldPriceExpr = oldPriceField
      ? (nullable(oldPriceField) ? `item.${oldPriceField.name}?.format()` : `item.${oldPriceField.name}.format()`)
      : null;
    const stockExpr = stockField ? chipToneExpr(stockField, "toneForStatus") : null;
    const escapeStr = (v: string) => v.replace(/'/g, "\\'");
    // S2.1 GAP-2 (S2_HARDENING_BRIEF_CLAUDE.md): every emitted section carries a
    // ValueKey('section-<id>') — makes `id` meaningful (keyed rendering + widget-test selectors +
    // future deep-link anchors) instead of pure IR bookkeeping. The `[sections]` gate's own
    // duplicate-id check is what guarantees this key is actually unique per screen.
    const sectionKey = (id: string) => `ValueKey('section-${id}')`;

    // Empty-list copy shared by productGrid's inline EmptyState (GAP-3) — same "No <Title> yet"
    // convention the list branch's own plainEmptyExpr already uses.
    const sectionsEmptyExpr = `EmptyState(message: 'No ${appBarTitle} yet')`;

    // RCA-001: same `filtered`/`query` prelude the list branch's own searchPrelude computes
    // (screen.ts:848-852), scoped to this screen's resolved collection (`state.${collection}` —
    // sections has no parent-scope `items` local the way a child list screen's listFilterExpr
    // does, so it filters the state field directly). No-op (empty string) whenever this screen's
    // search didn't resolve — productGrid/horizontalCards keep reading `state.${collection}`
    // verbatim, byte-identical to before this fix.
    const sectionsSearchPrelude = searchEnabled
      ? `            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? state.${collection} : state.${collection}.where((item) => (${fieldValue(searchField!, "item")}).toLowerCase().contains(query)).toList();
`
      : "";
    const sectionsListVar = searchEnabled ? "filtered" : `state.${collection}`;

    // Depth-1 recursion (schema-enforced: `children` only exists on type:"section", one level,
    // leaves only — types.ts/screen.schema.json) — `indent` keeps nested Column children readable
    // in the emitted source, purely cosmetic. Every section type in the closed v1 enum is mapped
    // here; an unmapped type can only reach this function past a schema hard-reject (unknown enum
    // value) or the `[sections]` gate, so the `never` default is a true "cannot happen" guard, not
    // a silent SizedBox.shrink fallback (SPIKE_S2_REPORT.md §9's named failure mode).
    const renderSection = (section: SectionModel, indent: string): string => {
      switch (section.type) {
        case "header":
          return section.title
            ? `${indent}Padding(key: ${sectionKey(section.id)}, padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, AppSpacing.xs), child: Text('${escapeStr(section.title)}', style: Theme.of(context).textTheme.titleLarge)),`
            : ""; // the Scaffold's own AppBar (below) already renders the chrome header — a
                  // titleless `header` section is a structural marker only, nothing extra to emit.
        case "search":
          // RCA-001 (owner-reported: "search does not work in keemart app"): functional when
          // composition.ts's searchFor actually resolved this screen (declared `search` section +
          // entity primaryDisplayField, contract §4) — controller-wired, same
          // `controller: _searchController`/`onChanged: setState(() => _query = v)` the list
          // branch's own SearchBar block wires (screen.ts:858-867). Falls back to the pre-existing
          // decorative bare SearchBar (hintText/leading/shape only, no controller) when the
          // section is declared but unresolved (e.g. entity has no primaryDisplayField) — same
          // "declared but not wired" posture as before this fix, never a silent widget removal.
          // Still respects the decided radiusScale.search (S1 token rigor, S2_HARDENING_BRIEF_CLAUDE.md:
          // "respect all of it") — same searchShapeArg the list branch's own SearchBar applies, so
          // a sections home's search field is just as sharp/pill as a list screen's under the same
          // cornerRadius decision.
          // RCA-002 (owner, iPhone Safari: "i can not type search term" — keyboard never opens):
          // same gesture-bound FocusNode.requestFocus() bypass crud_form.ts:88-110 wires for the
          // create form's first field — iOS Safari only opens the keyboard when `.focus()` runs
          // synchronously inside the tap's own handler, and Flutter web's lazy DOM `<input>` proxy
          // creation pushes `.focus()` outside that window on the first tap otherwise. NO autofocus
          // (RCA-005 found autofocus makes this worse — see crud_form.ts's doc comment). Only ever
          // emitted when searchEnabled (the `_searchFocus` field this references only exists on
          // that branch, same guard `_searchController` already needs).
          return searchEnabled
            ? `${indent}Padding(key: ${sectionKey(section.id)}, padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 0), child: SearchBar(controller: _searchController, focusNode: _searchFocus, onTap: () => _searchFocus.requestFocus(), hintText: 'Search ${escapeStr(appBarTitle)}', leading: const Icon(Icons.search), onChanged: (v) => setState(() => _query = v)${searchShapeArg})),`
            : `${indent}Padding(key: ${sectionKey(section.id)}, padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, 0), child: SearchBar(hintText: 'Search ${escapeStr(appBarTitle)}', leading: const Icon(Icons.search)${searchShapeArg})),`;
        case "hero":
        case "promoBanner":
          return `${indent}Padding(key: ${sectionKey(section.id)}, padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.sm, AppSpacing.md, ${itemGapExpr}), child: AppHeroBanner(headline: '${escapeStr(section.title ?? appBarTitle)}', compact: ${section.type === "promoBanner"}${radiusArg})),`;
        case "productGrid":
          // SliverGridDelegateWithMaxCrossAxisExtent: columns are f(width) by construction (never
          // an IR column count — VLM_DESIGN_TO_IR_CONTRACT_V2.md:304-305's "no columns" rule);
          // mainAxisExtent is a fixed token row height (a product card's title+price+stock+add
          // content needs more room than the delegate's own 1.0 default childAspectRatio gives).
          // S2.1 GAP-3: the grid sits inside a shrinkWrapped NeverScrollableScrollPhysics parent —
          // an empty backing list renders zero children (a real but invisible empty state), so an
          // inline EmptyState stands in for the grid when the collection is empty.
          return `${indent}Padding(
${indent}  key: ${sectionKey(section.id)},
${indent}  padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
${indent}  child: state.${collection}.isEmpty
${indent}      ? ${sectionsEmptyExpr}
${indent}      : ${searchEnabled ? `filtered.isEmpty && query.isNotEmpty\n${indent}          ? EmptyState(message: 'No results for "\$_query"')\n${indent}          : ` : ""}GridView.builder(
${indent}    shrinkWrap: true,
${indent}    physics: const NeverScrollableScrollPhysics(),
${indent}    gridDelegate: const SliverGridDelegateWithMaxCrossAxisExtent(
${indent}      maxCrossAxisExtent: AppTokens.gridExtent,
${indent}      mainAxisExtent: AppTokens.cardHeight,
${indent}      crossAxisSpacing: AppSpacing.sm,
${indent}      mainAxisSpacing: AppSpacing.sm,
${indent}    ),
${indent}    itemCount: ${sectionsListVar}.length,
${indent}    itemBuilder: (context, i) {
${indent}      final item = ${sectionsListVar}[i];
${indent}      return AppProductCard(
${indent}        title: ${productTitleExpr},
${indent}        price: ${productPriceExpr},
${indent}        oldPrice: ${productOldPriceExpr ?? "null"},
${indent}        stockLabel: ${stockExpr ? stockExpr.value : "null"},
${indent}        stockTone: ${stockExpr ? stockExpr.tone : "null"},
${indent}        onAdd: () => ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Added \${${productTitleExpr}} to cart')))${radiusArg},
${indent}      );
${indent}    },
${indent}  ),
${indent}),`;
        case "horizontalCards":
          return `${indent}SizedBox(
${indent}  key: ${sectionKey(section.id)},
${indent}  height: AppTokens.cardHeight,
${indent}  child: ListView.builder(
${indent}    scrollDirection: Axis.horizontal,
${indent}    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
${indent}    itemCount: ${sectionsListVar}.length,
${indent}    itemBuilder: (context, i) {
${indent}      final item = ${sectionsListVar}[i];
${indent}      return Padding(
${indent}        padding: const EdgeInsets.only(right: AppSpacing.sm),
${indent}        child: SizedBox(
${indent}          width: AppTokens.cardWidth,
${indent}          child: AppListCard(card: ${cardSurface}, title: Text(${productTitleExpr}), subtitle: Text(${productPriceExpr})${radiusArg}${cardInsetArg}),
${indent}        ),
${indent}      );
${indent}    },
${indent}  ),
${indent}),`;
        case "sectionHeader":
          return section.title
            ? `${indent}Padding(key: ${sectionKey(section.id)}, padding: const EdgeInsets.fromLTRB(AppSpacing.md, AppSpacing.md, AppSpacing.md, AppSpacing.xs), child: Text('${escapeStr(section.title)}', style: Theme.of(context).textTheme.titleMedium)),`
            : "";
        case "section": {
          const children = (section.children ?? []).map((c) => renderSection(c, `${indent}  `)).filter(Boolean);
          if (!children.length) return "";
          return `${indent}Column(key: ${sectionKey(section.id)}, crossAxisAlignment: CrossAxisAlignment.stretch, children: [
${children.join("\n")}
${indent}]),`;
        }
        case "divider":
          return `${indent}Padding(key: ${sectionKey(section.id)}, padding: const EdgeInsets.symmetric(vertical: AppSpacing.xs), child: const Divider()),`;
        case "floatingCart":
          return ""; // rendered as the Scaffold's floatingActionButton (below), not inline here.
        default: {
          const exhaustive: never = section.type;
          throw new Error(`[sections] no renderer mapped for section type '${String(exhaustive)}'`);
        }
      }
    };

    const spacer = `              const SizedBox(height: ${itemGapExpr}),`;
    const sectionWidgets = (sectionsSpec?.sections ?? []).map((sec) => renderSection(sec, "              ")).filter(Boolean);
    const interleaved = sectionWidgets.flatMap((w, i) => (i === 0 ? [w] : [spacer, w]));
    body = `${sectionsSearchPrelude}            return ListView(
              padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
              children: [
${interleaved.join("\n")}
              ],
            );`;
  } else if (comp.layout === "detail") {
    if (entity && entity.fields.length) {
      // UIX Slice C: role-aware layout — every field is rendered by its INFERRED ROLE (title,
      // description, status/priority, date, money, plain, identifier), not the same uniform
      // AppListCard for everything (design/flutter-app-builder/UIX_ENHANCEMENTS.md). Fixed render
      // order: heading → status/priority chips → date → description → money → plain → id (last,
      // muted — UIX Slice B, unchanged). `relation` (FK) fields are never rendered as raw text —
      // the parent→children nav rows below already surface that relationship.
      const identityFieldName = entity.identity?.field ?? "id";
      const roleCtx = roleContextFor(entity, ctx);
      const byRole = (role: FieldRole) => entity.fields.filter((f) => fieldRole(f, roleCtx) === role);

      const titleField = byRole("title")[0];
      const statusField = byRole("status")[0];
      const priorityField = byRole("priority")[0];

      const blocks: string[] = [];
      if (titleField) {
        blocks.push(`Text(${fieldValue(titleField, "item")}, style: Theme.of(context).textTheme.headlineMedium)`);
      }
      if (statusField || priorityField) {
        const chips = [
          statusField ? chipToneExpr(statusField, "toneForStatus") : null,
          priorityField ? chipToneExpr(priorityField, "toneForPriority") : null,
        ].filter((c): c is { value: string; tone: string } => !!c);
        const chipWidgets = chips.map((c) => `AppChip(label: ${c.value}, tone: ${c.tone})`);
        const chipRow = chipWidgets.join(",\n                const SizedBox(width: AppSpacing.sm),\n                ");
        blocks.push(`Row(children: [\n                ${chipRow},\n              ])`);
      }
      // D2#2 (SPIKE_S6_REPORT.md §14.4.3 viewport-squeeze gate caught this): the value Text is the
      // variable-length part (a full ISO date string) — unwrapped, it forced this Row past its
      // available width at 320px and RenderFlex-overflowed. Flexible+ellipsis is a no-op at any
      // width the text already fits (390×844 goldens render byte-identical), and guarantees no
      // overflow regardless of how long a future date format ever gets.
      for (const f of byRole("date")) {
        blocks.push(`Row(children: [\n                const Icon(Icons.calendar_today, size: 16, color: AppColors.textSecondary),\n                const SizedBox(width: AppSpacing.xs),\n                Text('${fieldLabel(f.name)}', style: Theme.of(context).textTheme.bodySmall),\n                const SizedBox(width: AppSpacing.xs),\n                Flexible(child: Text(${fieldValue(f, "item")}, style: Theme.of(context).textTheme.bodyMedium, overflow: TextOverflow.ellipsis)),\n              ])`);
      }
      for (const f of byRole("description")) {
        blocks.push(`Text(${fieldValue(f, "item")}, style: Theme.of(context).textTheme.bodyMedium)`);
      }
      for (const f of byRole("money")) {
        blocks.push(`Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [\n                Text('${fieldLabel(f.name)}', style: Theme.of(context).textTheme.bodySmall),\n                Text(${fieldValue(f, "item")}, style: Theme.of(context).textTheme.labelMedium),\n              ])`);
      }
      // MF5: live remaining (limit − committed − actual) + over-limit warning. Appended right
      // after the raw limit/committed/actual money rows above (which still render individually —
      // this doesn't replace them, it summarizes them) — `budget` is declared once, before
      // `return ListView(...)`, so every block below can reference it.
      if (isBudgetEntity) {
        blocks.push(`Column(crossAxisAlignment: CrossAxisAlignment.start, children: [\n                Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [\n                  Text('Remaining', style: Theme.of(context).textTheme.bodySmall),\n                  Text(budget.remaining.format(), style: Theme.of(context).textTheme.labelMedium),\n                ]),\n                const SizedBox(height: AppSpacing.xs),\n                Text('used \${(budget.pctUsed * 100).round()}%', style: Theme.of(context).textTheme.bodySmall),\n                if (budget.isOverLimit) ...[\n                  const SizedBox(height: AppSpacing.xs),\n                  const AppChip(label: 'Over budget', tone: AppChipTone.danger),\n                ],\n              ])`);
      }
      for (const f of byRole("plain")) {
        blocks.push(`Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [\n                Text('${fieldLabel(f.name)}', style: Theme.of(context).textTheme.bodySmall),\n                Text(${fieldValue(f, "item")}, style: Theme.of(context).textTheme.bodyMedium),\n              ])`);
      }
      // UIX Slice B (preserved): the identity field is de-emphasized — rendered LAST in a muted
      // row, never first with equal weight (users scan title/status/date, not the id).
      if (entity.fields.some((f) => f.name === identityFieldName)) {
        blocks.push(`AppListCard(card: ${cardSurface}, title: Text('Id', style: Theme.of(context).textTheme.labelSmall), trailing: Text(item.${identityFieldName}, style: Theme.of(context).textTheme.labelSmall)${radiusArg}${cardInsetArg})`);
      }
      // itemGap (registry rhythm field) separates rows via a SizedBox, not a hardcoded constant.
      const rowsBlock = blocks
        .map((b, i) => (i === 0 ? `              ${b},` : `              const SizedBox(height: ${itemGapExpr}),\n              ${b},`))
        .join("\n");
      // Parent→children navigation rows (general capability): one per child entity carrying
      // `camelize(parent)+"Id"` (e.g. FollowUp.taskId under a Task detail). Links to the child's
      // list with `?<fk>=<id>`; the child list screen filters on that query param (listFilterExpr).
      // Dead-route guard: only a child that actually HAS a list screen gets a nav row — otherwise
      // `context.push('/x?fk=…')` hits a route that was never registered (go_router "Page Not
      // Found"), the same class of bug the list-row onTap guard above this already fixed. This
      // also correctly excludes an MF4 split child (e.g. LineItemSplit): it deliberately declares
      // no `screens` entry (edited inline via the parent's own form, see splitBlock below), so
      // without this guard it would otherwise get a broken generic "View LineItemSplits" link.
      const allEntities = (ctx?.ir?.entities ?? []) as Array<{ name: string; fields?: Field[] }>;
      const allScreens = (ctx?.ir?.screens ?? []) as Array<{ entity: string; type: string }>;
      const children = childLinks(s.entity, allEntities).filter((c) => allScreens.some((sc) => sc.entity === c.child && sc.type === "list"));
      const childRows = children.length
        ? "\n" + children.map((c) => `              const SizedBox(height: ${itemGapExpr}),\n              AppListCard(card: ${cardSurface}, title: Text('View ${c.child}s'), trailing: const Icon(Icons.chevron_right), onTap: () => context.push('/${kebab(c.child)}?${c.fkField}=\${id}')${radiusArg}${cardInsetArg}),`).join("\n")
        : "";
      // MF4: split breakdown (category → percent) — bloc-only in this iteration (mirrors the
      // Cubit read pattern the rest of this generator already uses for its own state; no current
      // sample combines riverpod with a split group, so the riverpod path is a documented gap,
      // not silently wrong output). ctx?.ir is required for splitGroupFor to have anything to
      // search, so this is a no-op (undefined) for any entity with no split group — every sample
      // this feature doesn't touch gets byte-identical output.
      const splitGroup = ctx?.ir && sm !== "riverpod" ? splitGroupFor(s.entity, ctx.ir) : undefined;
      const splitState = splitGroup ? (ctx?.ir?.states ?? []).find((st: any) => st.entity === splitGroup.child) : undefined;
      const splitBlock = splitGroup && splitState
        ? `\n              const SizedBox(height: ${itemGapExpr}),\n              Text('Split breakdown', style: Theme.of(context).textTheme.titleSmall),\n              const SizedBox(height: AppSpacing.xs),\n              BlocBuilder<${splitState.name}Cubit, ${splitState.name}State>(\n                builder: (context, splitState) {\n                  final lines = splitState.${collectionField(splitGroup.child)}.where((e) => e.${splitGroup.fkField} == id).toList();\n                  if (lines.isEmpty) {\n                    return const Text('No split configured', style: TextStyle(color: AppColors.textSecondary));\n                  }\n                  return Column(\n                    crossAxisAlignment: CrossAxisAlignment.stretch,\n                    children: [\n                      for (final l in lines)\n                        Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [\n                          Text(l.${splitGroup.categoryField ?? "id"}),\n                          Text('\${l.percent.toStringAsFixed(1)}%'),\n                        ]),\n                    ],\n                  );\n                },\n              ),`
        : "";
      if (splitGroup && splitState) {
        splitStateImport = ctx?.symbols.get(splitState.name)
          ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get(splitState.name)}';`
          : `import '../state/${splitState.name.toLowerCase()}.dart';`;
      }
      const budgetLocal = isBudgetEntity ? `\n            final budget = ${budgetLineExpr("item")};` : "";
      body = `            if (state.${collection}.isEmpty) return ${loc ? "" : "const "}Center(child: Text(${str("noData", "'No data'")}));
            final item = state.${collection}.firstWhere((e) => e.${identityField} == id, orElse: () => state.${collection}.first);${budgetLocal}
            return ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
${heroBlock}
${rowsBlock}${splitBlock}${childRows}
              ],
            );`;
    } else {
      body = `            return Center(child: Text(state.toString()));`;
    }
  } else if (comp.layout === "wizard") {
    // P8-W1/W2/W3/W4: step header (progress + title) + current step's field(s) + Next/Back/
    // Finish footer, gated by state.canAdvance and state.isLastStep (state.ts — the latter is
    // dynamic once branching is involved, never a compile-time index). Each field's VALUE still
    // lives in wizard state (via TextFormField.initialValue, keyed per field), not local widget
    // state — but RCA-002-ALL's per-field FocusNode (needed purely for the iOS Safari keyboard
    // bypass, see wizardFieldInput's own doc comment) DOES need to live in the screen's State,
    // which is why a wizard with any text-input field becomes a StatefulWidget below
    // (needsLocalState) even though it has no other local UI state.
    const steps: WizardStep[] = s.steps ?? [];
    const fieldDef = (name: string) => (entity ? entity.fields.find((f) => f.name === name) : undefined);
    const setterCall = (fieldName: string) => (valueExpr: string) => readMutator(`set${capitalize(fieldName)}`, valueExpr);
    const wizardRoleCtx = entity ? roleContextFor(entity, ctx) : undefined;
    wizardFocusFields = wizardTextInputFields(s, entity);
    const wizardFocusNames = new Set(wizardFocusFields.map((f) => f.name));

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
        const widgets = flds.map((f) => `                        ${wizardFieldInput(f, fieldDef(f), setterCall(f), wizardRoleCtx, wizardFocusNames.has(f))},`).join("\n");
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

    // B1: `wizardStatus`, not `status` — state.ts's generateWizardState namespaces the wizard's
    // internal flow-status field so it can't collide with an entity field the wizard also binds
    // (e.g. a review step bound to the entity's own `status`).
    body = `            if (state.wizardStatus == ${statusEnum}.success) return const Center(child: Text('All done!'));
            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                LinearProgressIndicator(value: (state.currentStep + 1) / ${Math.max(steps.length, 1)}),
                Padding(
                  padding: const EdgeInsets.fromLTRB(${screenGapExpr}, ${sectionGapExpr}, ${screenGapExpr}, ${heroGapExpr}),
                  child: Text(
                    switch (state.currentStep) {
${titleCases}
                      _ => '',
                    },
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                ),
                Expanded(
                  child: SingleChildScrollView(
                    padding: const EdgeInsets.symmetric(horizontal: AppSpacing.md),
                    child: switch (state.currentStep) {
${contentCases}
                      _ => const SizedBox(),
                    },
                  ),
                ),
                Padding(
                  padding: const EdgeInsets.all(${itemGapExpr}),
                  child: Row(
                    children: [
                      if (state.currentStep > 0)
                        TextButton(onPressed: () => ${readMutator("back", "")}, child: ${loc ? "" : "const "}Text(${str("back", "'Back'")})),
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
    // MF5: a budget-capable entity's list row shows "used X% · Y left" instead of the generic
    // subtitle fields — that's the one fact a budget row exists to communicate at a glance (the
    // row's title already carries the entity's own label field). `budget` is declared inline in
    // itemBuilder below, right after `final item = items[i];`.
    const subtitleExpr = isBudgetEntity
      ? `'used \${(budget.pctUsed * 100).round()}% · \${budget.remaining.format()} left'`
      : subtitleFields.length
        ? `'${subtitleFields.map((f) => `\${${fieldValue(f)}}`).join(" · ")}'`
        : "'—'";
    // Detail route target (routing.ts's screenPath() is the source of truth for the router
    // itself; this is the same no-collision formula screen.ts uses for the common case — see
    // AGENTS/DESIGN note in route.ts).
    const detailPath = `/${kebab(s.entity)}`;
    // Row tap/trailing: navigate to the detail screen when one exists; otherwise (§5.2-F1) tap
    // navigates straight to the edit form and a trailing delete icon replaces the chevron —
    // there's nowhere else for those affordances to live without a detail screen.
    // Dead-route guard (walkthrough finding): when the entity has NEITHER a detail screen NOR a
    // create/edit form, there is NO valid target — emitting the detail path `/x/:id` would make
    // every row tap land on a go_router "Page Not Found" (inventory, ledgerly-auth). Render the
    // row as a plain (non-tappable) card instead.
    const hasAnyTarget = listHasNavTarget;
    const onTapTarget = hasAnyTarget
      ? (!hasDetailScreen && canEditCreate ? `${formPath}/\${item.${identity}}/edit` : `${detailPath}/\${item.${identity}}`)
      : null;
    // UIX Slice C: a status/priority-colored dot is more meaningful than a generic initial-letter
    // avatar — replaces AppAvatar when the entity has either role (status wins if it has both,
    // since "is this done" is the row's primary at-a-glance fact); AppAvatar is the fallback for
    // every other entity, unchanged. Computed before trailingWidget below (quick-decision also
    // needs statusField).
    const roleCtx = entity ? roleContextFor(entity, ctx) : undefined;
    const statusField = entity && roleCtx ? entity.fields.find((f) => fieldRole(f, roleCtx) === "status") : undefined;
    const priorityField = entity && roleCtx ? entity.fields.find((f) => fieldRole(f, roleCtx) === "priority") : undefined;
    // LM6/general "quick decision" capability (operations.ts's quickDecisionTargets — single
    // source shared with test.ts's regression test): a review-queue entity has nowhere else for a
    // "set the status" action to live, since there's no row target to navigate to. Renders one
    // small button per OTHER enum value directly on the row, reconstructing the full entity
    // (identity + every other field carried from `item` unchanged) with just this field flipped,
    // through the SAME update() the repo/Cubit already expose (§5.2-F1) — no new repo/usecase
    // surface. Icon choice reuses AppChip.toneForStatus's existing vocabulary heuristic
    // (danger-toned values, e.g. "rejected", get a close icon; everything else gets a check)
    // rather than hardcoding entity-specific value names.
    const quickDecision = !hasAnyTarget && ctx?.ir ? quickDecisionTargets(ctx.ir).get(s.entity) : undefined;
    const quickDecisionWidget = quickDecision && entity
      ? (() => {
          const reconstruct = (valueExpr: string) =>
            entity.fields.map((f) => (f.name === quickDecision.field.name ? `${f.name}: ${valueExpr}` : `${f.name}: item.${f.name}`)).join(", ");
          return `Row(mainAxisSize: MainAxisSize.min, children: [
                                for (final v in ${quickDecision.enumType}.values.where((v) => v != item.${quickDecision.field.name}))
                                  IconButton(
                                    tooltip: v.name,
                                    icon: Icon(AppChip.toneForStatus(v.name) == AppChipTone.danger ? Icons.close : Icons.check, color: AppChip.colorForTone(context, AppChip.toneForStatus(v.name))),
                                    onPressed: () => ${readMutator("update", `${entity.name}(${reconstruct("v")})`)},
                                  ),
                              ])`;
        })()
      : undefined;
    // quickDecisionWidget writes the enum type name literally (`${quickDecision.enumType}.values`),
    // unlike every other list/detail expression in this file (which only ever accesses `.name` on
    // an already-typed `item.field`) — same reasoning wizardTypeImports already documents for
    // wizard bodies; reuses that same slot rather than adding a new always-present template line.
    if (quickDecision) {
      wizardTypeImports = importsFromTypes([quickDecision.enumType, s.entity], ctx).join("\n");
    }
    // G3: `push` (not `go`) so the detail/edit screen this row leads to gets a real back stack
    // entry — go_router renders the AppBar's back chevron automatically once Navigator.canPop is
    // true, no explicit `leading:` needed. `go` REPLACES the current entry, which is why the
    // owner's report ("no back affordance" + "browser back behaves oddly") traced to every arrival
    // navigation in this file using `go`.
    const trailingWidget = quickDecisionWidget
      ? quickDecisionWidget
      : !hasDetailScreen && canDelete
        ? `IconButton(tooltip: ${str("delete", "'Delete'")}, icon: const Icon(Icons.delete), onPressed: () => ${readMutator("delete", `item.${identity}`)})`
        : (hasAnyTarget ? `const Icon(Icons.chevron_right)` : `const SizedBox.shrink()`);
    // Parent-scoped list filtering (child list screens reached via a parent's detail link): a
    // `?<fk>=<parentId>` query param restricts rows to that parent's children; no param → all rows.
    const listFilter = listFilterExpr(childFk, collection);
    const leadingWidget = statusField
      ? (() => { const c = chipToneExpr(statusField, "toneForStatus"); return `AppStatusDot(tone: ${c.tone}, semanticLabel: ${c.value})`; })()
      : priorityField
        ? (() => { const c = chipToneExpr(priorityField, "toneForPriority"); return `AppStatusDot(tone: ${c.tone}, semanticLabel: ${c.value})`; })()
        : `AppAvatar(label: ${titleExpr})`;
    // P2: filter is computed from `items` (already parent-scope-filtered by listFilter above)
    // BEFORE the Column is built, so both the SearchBar block and the list/empty-state branch
    // below can reference `filtered`/`query` — in-memory, synchronous, case-insensitive `contains`
    // only (contract §4, grill C6: no server-query in this slice).
    const searchPrelude = searchEnabled
      ? `            final query = _query.trim().toLowerCase();
            final filtered = query.isEmpty ? items : items.where((item) => (${fieldValue(searchField!, "item")}).toLowerCase().contains(query)).toList();
`
      : "";
    const listVar = searchEnabled ? "filtered" : "items";
    // Material 3's own SearchBar widget (package:flutter/material.dart) — a stock framework
    // widget used directly, same posture Scaffold/AppBar/ListView.builder/Scrollbar already take
    // in this file (the component registry wraps only this app's own custom design-system atoms,
    // not stock Flutter/Material widgets).
    const searchBarBlock = searchEnabled
      ? `                Padding(
                  padding: const EdgeInsets.fromLTRB(${screenGapExpr}, ${screenGapExpr}, ${screenGapExpr}, 0),
                  child: SearchBar(
                    controller: _searchController,
                    focusNode: _searchFocus,
                    onTap: () => _searchFocus.requestFocus(),
                    hintText: 'Search ${appBarTitle}',
                    leading: const Icon(Icons.search),
                    onChanged: (v) => setState(() => _query = v)${searchShapeArg},
                  ),
                ),
`
      : "";
    // P5/D2 Slice 3 (SPIKE_P5_D2_REPORT.md §14.1, brief): the list's scroll parent, pulled out so
    // it can be wrapped in RefreshIndicator (below) without hand-balancing parens inline.
    const scrollConfigExpr = `ScrollConfiguration(
                    behavior: const AppScrollBehavior(),
                    child: Scrollbar(
                      thumbVisibility: true,
                      child: ListView.builder(
                        physics: const AlwaysScrollableScrollPhysics(),
                        padding: const EdgeInsets.symmetric(horizontal: ${screenGapExpr}, vertical: AppSpacing.sm),
                        itemCount: ${listVar}.length,
                        itemBuilder: (_, i) {
                          final item = ${listVar}[i];${isBudgetEntity ? `\n                          final budget = ${budgetLineExpr("item")};` : ""}
                          return Padding(
                            padding: const EdgeInsets.only(bottom: ${itemGapExpr}),
                            child: AppListCard(
                              key: ValueKey(item.${identity}),
                              card: ${cardSurface},
                              leading: ${leadingWidget},
                              title: Text(${titleExpr}),
                              subtitle: Text(${subtitleExpr}),
                              trailing: ${trailingWidget},
                              onTap: ${onTapTarget ? `() => context.push('${onTapTarget}')` : "null"}${radiusArg}${cardInsetArg},
                            ),
                          );
                        },
                      ),
                    ),
                  )`;
    // O6.3 (retry/refresh — lists only, §16 decision): RefreshIndicator wraps the scroll parent
    // when composition.ts decided this screen's repo has load() and the archetype is a list.
    // `readMutator("load", "")` already resolves bloc vs riverpod (context.read<X>().load() /
    // ref.read(...).load()) — RefreshIndicator's onRefresh wants exactly the Future<void> it
    // returns.
    const refreshableScroll = placement?.refresh
      ? `RefreshIndicator(
                    onRefresh: () => ${readMutator("load", "")},
                    child: ${scrollConfigExpr},
                  )`
      : scrollConfigExpr;
    // The pre-existing search/no-results branch stays exactly as it was (contract boundary #4:
    // it coexists with, and is distinct from, the plain-empty-collection case below) — it only
    // ever fires once `items` itself is non-empty (query.isNotEmpty on an empty collection can't
    // happen: the SearchBar is only reachable once there's something to search).
    const searchOrList = searchEnabled
      ? `filtered.isEmpty && query.isNotEmpty
                      ? EmptyState(message: 'No results for "\$_query"')
                      : ${refreshableScroll}`
      : refreshableScroll;
    // O6.2 (empty-state CTA): "New <Entity>" navigates and labels itself IDENTICALLY to the FAB
    // (newFormOnPressed/newLabel, hoisted near formPath/childFk) — only rendered when
    // crudFormTargets(ir) says this entity has a create form (placement.emptyCta); a non-CRUD
    // entity (e.g. an update-only review queue) still gets the plain EmptyState, never a CTA
    // with no target (contract boundary #3's DoD bullet).
    const emptyCtaAction = placement?.emptyCta
      ? `,\n                        action: OutlinedButton(onPressed: ${newFormOnPressed}, child: Text(${newLabel}))`
      : "";
    const plainEmptyExpr = `EmptyState(message: 'No ${appBarTitle} yet'${emptyCtaAction})`;
    // placement.empty (list archetype, composition.ts) gates the plain-empty-collection branch —
    // checked BEFORE the search-not-found branch above, since a truly empty collection also has
    // query.isEmpty (nothing typed yet), so search's ternary would otherwise fall through to an
    // empty ListView with no message (the bug this slice fixes, brief's screen.ts:71 citation).
    const listOrEmpty = placement?.empty
      ? `items.isEmpty
                      ? ${plainEmptyExpr}
                      : ${searchOrList}`
      : searchOrList;
    body = `${listFilter}${searchPrelude}            return Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
${searchBarBlock}${heroBlock}
                Expanded(
                  // RCA-006: AppScrollBehavior opts every input device (touch/mouse/trackpad/
                  // stylus) into drag-to-scroll — Flutter's default excludes mouse, which is why
                  // a real mouse-drag never scrolled this list even though touch always did.
                  // Scrollbar(thumbVisibility: true) makes the list's scrollability visible up
                  // front, not just discoverable by already dragging (the owner's "no scroller"
                  // report) — AlwaysScrollableScrollPhysics keeps the list draggable/bouncable
                  // even on the rare screen where content doesn't yet overflow.
                  child: ${listOrEmpty},
                ),
              ],
            );`;
  }

  const stateImport = ctx?.symbols.get(s.state)
    ? `import 'package:${ctx.pkg}/${ctx.symbols.get(s.state)}';`
    : `import '${s.state.toLowerCase()}.dart';`;
  const componentsImport = ctx ? `import 'package:${ctx.pkg}/core/components.dart';` : "import '../../core/components.dart';";
  const themeImport = ctx ? `import 'package:${ctx.pkg}/core/theme.dart';` : "import '../../core/theme.dart';";

  // P5/D2 Slice 2 (placement decided above, near formPath/newFormOnPressed) drives loading/error;
  // Slice 3 (SPIKE_P5_D2_REPORT.md §14.1) adds the retry OutlinedButton onto the error branch when
  // placement.retry (error AND the state's Cubit/Notifier has load(), which state.ts emits
  // unconditionally on every non-wizard state — see composition.ts's statePlacementFor doc
  // comment). No entry (wizard) emits neither branch — the wizard compile-bug fix (§3.3): the old
  // unconditional literals compared against a `status` getter the wizard state never declares.
  // `s.type === "list"` extra gate: composition.ts's `retry` field mirrors `error` at the STATE-
  // MODEL level (so a detail screen sharing a list's cubit also sees placement.retry=true) — but
  // the owner's §16 decision scopes the rendered button to lists only ("detail-screen retry is a
  // follow-up, not this slice"); `checks` itself (loading/error) still renders unchanged on a
  // shared-cubit detail screen, only the retry button is withheld there.
  const errorState = placement?.retry && s.type === "list"
    ? `ErrorState(message: state.errorMessage, onRetry: () => ${readMutator("load", "")})`
    : `ErrorState(message: state.errorMessage)`;
  const checks = placement
    ? [
        placement.loading ? `        if (state.${placement.flowField} == ${statusEnum}.loading) return const LoadingState();` : null,
        placement.error ? `        if (state.${placement.flowField} == ${statusEnum}.failure) return ${errorState};` : null,
      ].filter(Boolean).join("\n")
    : "";

  // Subscription differs by provider (arch layer): bloc = BlocBuilder, riverpod = ConsumerWidget + ref.watch.
  const stateLibImport = sm === "riverpod"
    ? `import 'package:flutter_riverpod/flutter_riverpod.dart';`
    : `import 'package:flutter_bloc/flutter_bloc.dart';`;

  // Detail-only: `id` is read once at the top of build() so both the AppBar edit/delete actions
  // and the nested BlocBuilder/Builder body can use it (§5.2-F1).
  const preBuild = comp.layout === "detail" ? `    final id = GoRouterState.of(context).pathParameters['id'];\n` : "";

  // P4 (contract §6): THIS screen's decided ActionSpec[] (composition.ts's actionsTargets,
  // computed once per generateApp run) — consumed by kind/presentation, NEVER re-derived here
  // (S-P4 invariants 1 & 3: actionsFor() is the only action decision; this renderer never counts
  // actions or re-reads crudTarget/audit/export). Null-set: no entry in ctx.actions → no actions
  // rendered (byte-identical, invariant 7). `save` is a semantic kind only and is never emitted
  // as a control (invariant 6 — the form's PrimaryButton is its renderer).
  const decided = ctx?.actions?.get(s.name) ?? [];

  // L3: export action(s) on a list screen whose `export:` resolves against a real `exported: bool`
  // field (operations.ts's resolveExport) — bloc-only this iteration, same documented-gap posture
  // MF4's split-breakdown block already takes ("no current sample combines riverpod with X").
  // Each button (a) computes CSV/JSON of the CURRENTLY listed rows via the field-aware `fieldValue`
  // expressions already used for on-screen rendering (Money → .format(), enum → .name, ...), (b)
  // stamps every not-yet-exported row `exported: true` through the existing update() Cubit method
  // (no new repo/usecase surface — reuses §5.2-F1's CRUD machinery), guarding already-exported rows
  // so a second click is a safe no-op instead of hitting repository_impl.ts's immutability throw.
  const exportButtons: string[] = [];
  if (s.type === "list" && sm !== "riverpod" && resolvedExport) {
    const exportEntity = resolvedExport.entity;
    const exportedFieldName = resolvedExport.exportedField.name;
    const fields = exportableFields(exportEntity);
    const headerList = fields.map((f) => `'${f.name}'`).join(", ");
    const rowEntries = fields.map((f) => `'${f.name}': ${fieldValue(f, "item")}`).join(", ");
    const reconstruct = exportEntity.fields
      .map((f) => (f.name === exportedFieldName ? "exported: true" : `${f.name}: row.${f.name}`))
      .join(", ");
    const stampAndSnack = (formatLabel: string, varName: string, computeExpr: string) =>
      `        IconButton(\n` +
      `          tooltip: 'Export ${formatLabel}',\n` +
      `          icon: const Icon(Icons.download),\n` +
      `          onPressed: () async {\n` +
      `            final rows = context.read<${s.state}Cubit>().state.${collection}.map((item) => <String, dynamic>{${rowEntries}}).toList();\n` +
      `            ${computeExpr}\n` +
      `            for (final row in context.read<${s.state}Cubit>().state.${collection}) {\n` +
      `              if (!row.${exportedFieldName}) {\n` +
      `                await ${readMutator("update", `${exportEntity.name}(${reconstruct})`)};\n` +
      `              }\n` +
      `            }\n` +
      `            if (context.mounted) {\n` +
      `              ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Exported \${rows.length} rows to ${formatLabel} (\${${varName}.length} chars)')));\n` +
      `            }\n` +
      `          },\n` +
      `        ),\n`;
    const mode = resolvedExport.screen.export!;
    if (mode === "csv" || mode === "csv+json") exportButtons.push(stampAndSnack("CSV", "csv", `final csv = toCsv(rows, const [${headerList}]);`));
    if (mode === "json" || mode === "csv+json") exportButtons.push(stampAndSnack("JSON", "json", `final json = toJson(rows);`));
  }

  // P4 renderer — emits each decided ActionSpec by its decided presentation (invariant 3: this
  // never computes grouping). Inline/primary actions render as AppBar IconButtons; overflow
  // actions collapse into ONE PopupMenuButton (the "…" menu). Each action's handler closure is
  // built ONCE (per kind) and consumed by whichever presentation it's assigned. Delete with
  // confirm wraps the handler in a showDialog — Cancel returns early (no mutation), Confirm runs
  // the existing delete (invariant 4). Audit navigates to the generated /audit-log route
  // (invariant 5). `save` is never emitted (invariant 6). Export reuses exportButtons (bloc-only,
  // documented gap) as inline actions. tooltip doubles as the accessible/semantic label for these
  // icon-only buttons (required for CDP flow drivers to locate them by aria-label).
  //
  // `handlersByKind` maps an action kind → its complete Dart handler EXPRESSION, reused by both
  // presentations. edit/audit are sync arrow closures; delete is an async closure (confirm +
  // mutate + go). The SAME closure literal feeds onPressed (inline) and onSelected/onTap
  // (overflow), so each action's behavior lives in ONE place.
  const handlersByKind: Partial<Record<ActionKind, string>> = {};
  for (const a of decided) {
    const t = (key: string, literal: string) => str(key, literal);
    if (a.kind === "edit" && !handlersByKind.edit) {
      handlersByKind.edit = `() => context.push('${formPath}/\${id}/edit')`;
    } else if (a.kind === "delete" && !handlersByKind.delete) {
      const label = t("delete", "'Delete'");
      handlersByKind.delete = a.confirm
        ? `() async {\n` +
          `            final confirmed = await showDialog<bool>(\n` +
          `              context: context,\n` +
          `              builder: (_) => AlertDialog(\n` +
          `                title: Text('Delete ${s.entity}?'),\n` +
          `                content: const Text('This action cannot be undone.'),\n` +
          `                actions: [\n` +
          `                  TextButton(onPressed: () => Navigator.pop(context, false), child: Text(${t("cancel", "'Cancel'")})),\n` +
          `                  FilledButton(onPressed: () => Navigator.pop(context, true), child: Text(${label})),\n` +
          `                ],\n` +
          `              ),\n` +
          `            );\n` +
          `            if (confirmed != true || !context.mounted) return;\n` +
          `            await ${readMutator("delete", "id!")};\n` +
          `            if (context.mounted) context.go('${formPath}');\n` +
          `          }`
        : `() async { await ${readMutator("delete", "id!")}; if (context.mounted) context.go('${formPath}'); }`;
    } else if (a.kind === "audit" && !handlersByKind.audit) {
      handlersByKind.audit = `() => context.push('/audit-log')`;
    }
  }
  const handlerFor = (a: ActionSpec): string => handlersByKind[a.kind] ?? `() {}`;

  // Partition by the DECIDED presentation (never counted/grouped here — invariant 3).
  const inlineActions: string[] = [];
  const overflowActions: { id: string; label: string; icon: string; handler: string }[] = [];
  for (const a of decided) {
    const capitalized = a.label ? a.label.charAt(0).toUpperCase() + a.label.slice(1) : a.label;
    const label = str(a.label, `'${capitalized}'`);
    // export (list screen) is emitted by the exportButtons block above (bloc-only, documented
    // gap) — its real CSV/JSON + stamp-and-snack logic, never a generic IconButton. The action's
    // presence is still a DECIDED fact (actionsFor returned it); exporting via exportButtons keeps
    // the implementation, decided separately from the payload it gates on.
    if (a.kind === "export") {
      inlineActions.push(...exportButtons);
      continue;
    }
    if (a.presentation === "overflow") {
      overflowActions.push({ id: a.kind, label, icon: a.icon, handler: handlerFor(a) });
    } else {
      inlineActions.push(`        IconButton(tooltip: ${label}, icon: const Icon(${a.icon}), onPressed: ${handlerFor(a)}),\n`);
    }
  }

  // Overflow "…" menu: ONE PopupMenuButton whose onSelected dispatches by action VALUE to the SAME
  // handler closure the inline path uses (single behavior home). Each PopupMenuItem carries a
  // leading icon + the localized label; selecting it pops with its kind value and onSelected runs
  // that kind's handler. Unknown values (defensive) are ignored.
  const overflowMenu = overflowActions.length
    ? `        PopupMenuButton<String>(\n` +
      `          icon: const Icon(Icons.more_vert),\n` +
      `          tooltip: 'More actions',\n` +
      `          onSelected: (value) {\n` +
      overflowActions.map((a) => `            if (value == '${a.id}') (${a.handler})();\n`).join("") +
      `          },\n` +
      `          itemBuilder: (_) => [\n` +
      overflowActions.map((a) => `            PopupMenuItem(value: '${a.id}', child: Row(children: [Icon(${a.icon}), const SizedBox(width: AppSpacing.sm), Text(${a.label})])),\n`).join("") +
      `          ],\n` +
      `        ),\n`
    : "";

  const appBarActions = inlineActions.length || overflowActions.length
    ? `,\n      actions: [\n${inlineActions.join("")}${overflowMenu}      ]`
    : "";

  // FAB reuses newFormOnPressed/newLabel (hoisted above, near formPath/childFk) — Slice 3's
  // empty-state CTA navigates and labels itself IDENTICALLY (SPIKE_P5_D2_REPORT.md §16: "confirm
  // the existing FAB `?<fk>=` forwarding is the desired nav").
  // S2: a sections screen's FAB is decided by its declared `floatingCart` section (Q1 table: "maps
  // to the existing FAB"), NEVER the generic canEditCreate check — a sections home's entity being
  // CRUD-capable is unrelated to whether the IR asked for a cart affordance.
  const fabApplies = comp.layout === "sections" ? hasFloatingCart : (comp.layout !== "detail" && comp.layout !== "wizard" && canEditCreate);
  if (loc && fabApplies) appStringsUsed = true;
  // FIX-1: the FAB was the other dominant control the cornerRadius rules never reached (always
  // Material's own circular default) — routed through the same decided radiusScale.fab as search.
  // FIX-3: fabInset wraps the button in an EXTRA Padding on top of Scaffold's own default FAB
  // margin — "" (no personality declared) omits the wrapper, byte-identical placement.
  const fabWidget = (tooltip: string, onPressed: string, icon: string) =>
    `FloatingActionButton(\n        tooltip: ${tooltip},\n        onPressed: ${onPressed},\n        child: const Icon(${icon})${fabShapeArg},\n      )`;
  // V1.1: a floatingCart section with a declared `target` becomes a real navigation affordance
  // (extended FAB, its own label) instead of the plain icon-only decorative cart button.
  const fabExtendedWidget = (label: string, onPressed: string, icon: string) =>
    `FloatingActionButton.extended(\n        label: Text(${label}),\n        icon: const Icon(${icon}),\n        onPressed: ${onPressed}${fabShapeArg},\n      )`;
  const wrapFabInset = (widget: string) =>
    fabInsetExpr ? `Padding(\n        padding: EdgeInsets.all(${fabInsetExpr}),\n        child: ${widget},\n      )` : widget;
  const fab = fabApplies
    ? (comp.layout === "sections"
        ? (fabTarget
            ? `,\n      floatingActionButton: ${wrapFabInset(fabExtendedWidget(`'${(floatingCartSection?.title ?? "Play").replace(/'/g, "\\'")}'`, `() => context.go('${fabTarget}')`, "Icons.play_arrow"))}`
            : `,\n      floatingActionButton: ${wrapFabInset(fabWidget("'Cart'", "() => ScaffoldMessenger.of(context).showSnackBar(const SnackBar(content: Text('Cart is empty')))", "Icons.shopping_cart"))}`)
        : `,\n      floatingActionButton: ${wrapFabInset(fabWidget(newLabel, newFormOnPressed, "Icons.add"))}`)
    : "";
  // L4: AppStrings import — same leading-"\n"-folded-into-the-value trick as budgetImport/
  // exportImport use, so a non-locale (or locale-aware-but-unused-here) screen's import block
  // gains zero extra blank lines. Computed here (not earlier) so every str()/FAB call site above
  // has already had a chance to set appStringsUsed.
  const l10nImport = appStringsUsed
    ? "\n" + (ctx?.symbols.get("AppStrings") ? `import 'package:${ctx!.pkg}/${ctx!.symbols.get("AppStrings")}';` : "import '../../core/app_strings.dart';")
    : "";

  // P3 (contract §5): M3 Expressive on-scroll AppBar color-fill. `_scrolled` is LOCAL widget UI
  // state only — precisely the "IR state ≠ scroll/UI state" carve-out the contract demands (P2's
  // `_query` already established this). backgroundColor stays `null` (= theme default, so at-rest
  // pixels/goldens are byte-identical to pre-P3) and flips to `ColorScheme.surfaceContainerHighest`
  // (a stock Material 3 token — passes the [architecture] raw-color gate) once the viewport
  // scrolls past the top. State-management AGNOSTIC by design (unlike search): riverpod screens
  // become a ConsumerStatefulWidget (`ref` is a getter on ConsumerState) and bloc list/detail
  // screens a plain StatefulWidget, so the riverpod sample renders the same listener — no latent
  // [scroll] gate gap.
  // RCA-002-ALL: a wizard screen with any text-input step field needs its FocusNode bypass state
  // to live somewhere — same "IR state ≠ scroll/UI state"-style carve-out P3/P2 already
  // established, just for a per-field FocusNode instead of a query string or scroll flag.
  const wizardFocusEnabled = wizardFocusFields.length > 0;
  const wizardFocusDecls = wizardFocusFields.map((f) => `  final _${f.name}Focus = FocusNode();\n`).join("");
  const wizardFocusDispose = wizardFocusFields.map((f) => `    _${f.name}Focus.dispose();\n`).join("");
  const needsLocalState = scrollEnabled || searchEnabled || wizardFocusEnabled;
  const needsRiverpodState = scrollEnabled || wizardFocusEnabled;
  const scrollAppBarSuffix = scrollEnabled
    ? `, backgroundColor: _scrolled ? Theme.of(context).colorScheme.surfaceContainerHighest : null`
    : "";
  const riverpodBodyWrap = scrollEnabled
    ? `NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: Builder(builder: (_) {
${checks}
${body}
        }),
      )`
    : `Builder(builder: (_) {
${checks}
${body}
      })`;

  const widgetBody = sm === "riverpod"
    ? needsRiverpodState
      ? `class ${s.name} extends ConsumerStatefulWidget {
  const ${s.name}({super.key});

  @override
  ConsumerState<${s.name}> createState() => _${s.name}State();
}

class _${s.name}State extends ConsumerState<${s.name}> {
${wizardFocusDecls}${scrollEnabled ? `  bool _scrolled = false;
` : ""}${wizardFocusEnabled ? `  @override
  void dispose() {
${wizardFocusDispose}    super.dispose();
  }

` : ""}  @override
  Widget build(BuildContext context) {
${preBuild}    final state = ref.watch(${s.state.charAt(0).toLowerCase()}${s.state.slice(1)}Provider);
    return Scaffold(
      appBar: AppBar(title: ${titleTextExpr}${scrollAppBarSuffix}${appBarActions}),
      body: ${riverpodBodyWrap}${fab},
    );
  }
}`
      : `class ${s.name} extends ConsumerWidget {
  const ${s.name}({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
${preBuild}    final state = ref.watch(${s.state.charAt(0).toLowerCase()}${s.state.slice(1)}Provider);
    return Scaffold(
      appBar: AppBar(title: ${titleTextExpr}${appBarActions}),
      body: Builder(builder: (_) {
${checks}
${body}
      })${fab},
    );
  }
}`
    : needsLocalState
      // P2/P3: search needs local widget state (the query string) that lives OUTSIDE the Cubit/
      // business state, P3's scroll needs a local `_scrolled` flag, and RCA-002-ALL's wizard
      // FocusNode bypass needs somewhere to live too (contract §3/P5's "IR state ≠ scroll/UI
      // state" principle covers all three — none of them belong in the Cubit/Notifier). This is
      // the only reason these screens become a StatefulWidget instead of the usual
      // StatelessWidget; everything else (Scaffold/AppBar/BlocBuilder/fab) is unchanged.
      ? `class ${s.name} extends StatefulWidget {
  const ${s.name}({super.key});

  @override
  State<${s.name}> createState() => _${s.name}State();
}

class _${s.name}State extends State<${s.name}> {
${searchEnabled ? `  final _searchController = TextEditingController();
  final _searchFocus = FocusNode();
  String _query = '';
` : ""}${wizardFocusDecls}${scrollEnabled ? `  bool _scrolled = false;
` : ""}${(searchEnabled || wizardFocusEnabled) ? `  @override
  void dispose() {
${searchEnabled ? `    _searchController.dispose();
    _searchFocus.dispose();
` : ""}${wizardFocusDispose}    super.dispose();
  }

` : ""}  @override
  Widget build(BuildContext context) {
${preBuild}    return Scaffold(
      appBar: AppBar(title: ${titleTextExpr}${scrollAppBarSuffix}${appBarActions}),
      body: ${scrollEnabled ? `NotificationListener<ScrollNotification>(
        onNotification: (n) {
          if (n is ScrollUpdateNotification) {
            final beingScrolled = n.metrics.extentBefore > 0;
            if (beingScrolled != _scrolled) setState(() => _scrolled = beingScrolled);
          }
          return false;
        },
        child: ` : ""}BlocBuilder<${s.state}Cubit, ${stateClass}>(
        builder: (context, state) {
${checks}
${body}
        }${scrollEnabled ? `,\n        ),\n      )` : `,\n      )`}${fab},
    );
  }
}`
      : `class ${s.name} extends StatelessWidget {
  const ${s.name}({super.key});

  @override
  Widget build(BuildContext context) {
${preBuild}    return Scaffold(
      appBar: AppBar(title: ${titleTextExpr}${appBarActions}),
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
  // a wizard screen navigates entirely through its own Cubit/Notifier methods, a "dead" list
  // (entity has neither a detail screen nor a create/edit form → onTap: null, no nav affordances)
  // never references the router either (dead-route guard), and a sections screen navigates
  // nowhere in this slice (its add/cart affordances are SnackBar-only, no route.ts change per the
  // spike's routing-is-agnostic finding) — so it would otherwise get an unused_import.
  const routerImport = comp.layout !== "wizard" && (comp.layout !== "sections" || !!fabTarget) && !(comp.layout === "list" && !listHasNavTarget) ? `import 'package:go_router/go_router.dart';\n` : "";

  return `// [generated] generator=ScreenGenerator template=screen_${s.type}_${sm}${searchEnabled ? "_search" : ""}${scrollEnabled ? "_scroll" : ""}.v1 class=structural ownership=generated
// Do not hand-edit this file; regenerate from IR.
import 'package:flutter/material.dart';
${routerImport}${stateLibImport}
${componentsImport}
${themeImport}
${stateImport}
${wizardTypeImports}
${splitStateImport}
${budgetImport}${exportImport}${l10nImport}

${widgetBody}
`;
}
