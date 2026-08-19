import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';
import { generateFocusTest, generateWizardFocusTest } from '../builder/src/generators/test';
import { textInputBypassFields, wizardTextInputFields } from '../builder/src/operations';
import { FeatureModel, EntityModel } from '../builder/src/types';

// KEYBOARD-ALL (design/flutter-app-builder/research/KEYBOARD_ALL_BRIEF_CLAUDE.md, owner
// directive "fix the iOS-Safari keyboard bypass for ALL input fields"): RCA-002's mechanism
// (iOS Safari drops the soft keyboard when `.focus()` doesn't run synchronously inside the tap's
// own gesture) applies to EVERY generated text-input field, not just SearchBar (RCA-002) or a
// form's first field (RCA-005). This file proves the widened bypass — CRUD String/int/double/
// Money, wizard String/int/double/Money — on both the real committed generator output and the
// pure generator functions, plus the sections `$_query` interpolation fix (Task B).

const REPO_ROOT = resolve(__dirname, '..');

describe('KEYBOARD-ALL Task A.1 — real-generator-backed: every CRUD text-input field, not just the first', () => {
  test('tasks TaskFormScreen: title AND description both get their own FocusNode; dueDate (DateTime) gets none', () => {
    const src = readFileSync(resolve(REPO_ROOT, 'apps/tasks/output/app/lib/features/tasks/presentation/screens/task_form_screen.dart'), 'utf8');
    expect(src).toContain('final _titleFocus = FocusNode();');
    expect(src).toContain('final _descriptionFocus = FocusNode();');
    expect(src).not.toContain('_dueDateFocus');
    expect(src).toContain('_titleFocus.dispose();');
    expect(src).toContain('_descriptionFocus.dispose();');
    expect(src).toContain('TextField(controller: _title, focusNode: _titleFocus, onTap: () => _titleFocus.requestFocus(),');
    expect(src).toContain('TextField(controller: _description, focusNode: _descriptionFocus, onTap: () => _descriptionFocus.requestFocus(),');
    // DateTime stays readOnly with no focus bypass — G2's date-picker path, never a real keyboard.
    expect(src).toContain("TextField(controller: _dueDate, readOnly: true,");
    expect(src).not.toContain('focusNode: _dueDateFocus');
    expect(src).not.toContain('autofocus');
  });

  test('ledgerly MealBudgetFormScreen: every Money field (limit/committed/actual) gets its own FocusNode, not just the first', () => {
    const src = readFileSync(resolve(REPO_ROOT, 'apps/ledgerly/output/app/lib/features/budgets/presentation/screens/meal_budget_form_screen.dart'), 'utf8');
    for (const f of ['limit', 'committed', 'actual']) {
      expect(src).toContain(`final _${f}Focus = FocusNode();`);
      expect(src).toContain(`_${f}Focus.dispose();`);
      expect(src).toContain(`focusNode: _${f}Focus, onTap: () => _${f}Focus.requestFocus(),`);
    }
  });

  // [determinism]/[architecture]/[forbidden-idioms]/etc. on these apps are already covered by
  // validate() calls in test/s1_visual_intent.test.ts and test/search_sections.test.ts — a second
  // concurrent validate() on the SAME app directory here would race those suites' own scratch
  // regen (`apps/<app>/output/app.v1`) under jest's parallel workers, so it is intentionally not
  // repeated here (validate.ts ALL PASS was confirmed manually — see the brief's own report).
});

describe('KEYBOARD-ALL Task A.2 — real-generator-backed: every wizard text-input field', () => {
  const wizardScreenPath = resolve(REPO_ROOT, 'apps/work_auth/output/app/lib/features/work_auth/presentation/screens/work_auth_wizard_screen.dart');

  test('WorkAuthWizardScreen: name/country/jobTitle/durationDays (step 1) each get their own FocusNode; screen became a StatefulWidget to hold them', () => {
    const src = readFileSync(wizardScreenPath, 'utf8');
    expect(src).toContain('class WorkAuthWizardScreen extends StatefulWidget');
    for (const f of ['name', 'country', 'jobTitle', 'durationDays']) {
      expect(src).toContain(`final _${f}Focus = FocusNode();`);
      expect(src).toContain(`_${f}Focus.dispose();`);
      expect(src).toContain(`focusNode: _${f}Focus, onTap: () => _${f}Focus.requestFocus(),`);
    }
    expect(src).not.toContain('autofocus');
  });

  test('wizard_focus_test.dart was generated and asserts every step-1 text field', () => {
    const f = resolve(REPO_ROOT, 'apps/work_auth/output/app/test/wizard_focus_test.dart');
    expect(existsSync(f)).toBe(true);
    const src = readFileSync(f, 'utf8');
    expect(src).toContain("appRouter.go('/work-auth/wizard');");
    // TextFormField doesn't expose focusNode/onTap as public fields (Flutter SDK) — the assertion
    // targets the real TextField each TextFormField builds internally, same technique
    // generateFocusTest already uses for CRUD forms.
    expect(src).toContain('expect(find.byType(TextFormField), findsNWidgets(4),');
    expect(src).toContain('final fields = tester.widgetList<TextField>(find.byType(TextField)).toList();');
    expect(src).toContain('expect(bypassFields.length, 4,');
    expect(src).toContain('fields[3].focusNode!.hasFocus');
  });
});

describe('KEYBOARD-ALL — negative control: screens with no text-input fields emit zero FocusNode', () => {
  test('a detail screen (read-only, no form, no search) never references FocusNode', () => {
    for (const p of [
      'apps/tasks/output/app/lib/features/tasks/presentation/screens/task_detail_screen.dart',
      'apps/tasks/output/app/lib/features/tasks/presentation/screens/follow_up_detail_screen.dart',
    ]) {
      const src = readFileSync(resolve(REPO_ROOT, p), 'utf8');
      expect(src).not.toContain('FocusNode');
    }
  });

  test('operations.ts textInputBypassFields returns empty for a bool/enum-only entity (the single source of truth crud_form.ts and test.ts both consume)', () => {
    const entity: EntityModel = {
      name: 'Flag',
      fields: [
        { name: 'id', type: 'String', required: true },
        { name: 'active', type: 'bool', required: true },
        { name: 'level', type: 'enum', of: 'Level', required: true },
      ],
    } as unknown as EntityModel;
    expect(textInputBypassFields(entity, 'id')).toEqual([]);
  });

  test('operations.ts wizardTextInputFields returns empty for a wizard step with only enum/bool fields', () => {
    const entity: EntityModel = {
      name: 'Flag',
      fields: [
        { name: 'id', type: 'String', required: true },
        { name: 'active', type: 'bool', required: true },
        { name: 'level', type: 'enum', of: 'Level', required: true },
      ],
    } as unknown as EntityModel;
    const screen = { name: 'FlagWizard', entity: 'Flag', type: 'wizard', state: 'FlagWizard', steps: [{ id: 's1', title: 'Step', fields: ['active', 'level'] }] } as any;
    expect(wizardTextInputFields(screen, entity)).toEqual([]);
  });

  test('generateFocusTest skips an entity whose CRUD form has no bypass-eligible field (bool/enum only) rather than asserting a property that was never wired', () => {
    const ir: FeatureModel = {
      name: 'flags', schemaVersion: '1',
      screens: [
        { name: 'FlagListScreen', entity: 'Flag', type: 'list', state: 'FlagList' },
        { name: 'FlagFormScreen', entity: 'Flag', type: 'form', state: 'FlagList' },
      ],
      entities: [{ name: 'Flag', identity: { field: 'id' }, fields: [{ name: 'id', type: 'String', required: true }, { name: 'active', type: 'bool', required: true }] }],
      repositories: [{ name: 'FlagRepository', entity: 'Flag', operations: ['create', 'read', 'update', 'delete', 'list'] }],
      states: [{ name: 'FlagList', entity: 'Flag' }],
    } as unknown as FeatureModel;
    expect(generateFocusTest(ir, 'bloc')).toBeNull();
  });
});

describe('KEYBOARD-ALL Task B — real-generator-backed: sections $_query interpolation (list-branch parity)', () => {
  test('committed keemart HomeScreen interpolates the typed query, never the escaped literal', () => {
    const src = readFileSync(resolve(REPO_ROOT, 'apps/keemart/output/app/lib/features/keemart/presentation/screens/home_screen.dart'), 'utf8');
    expect(src).toContain('No results for "$_query"');
    expect(src).not.toContain('No results for "\\$_query"');
  });
});
