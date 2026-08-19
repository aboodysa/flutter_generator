import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync, existsSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { generateSearchFocusTest } from '../builder/src/generators/test';
import { FeatureModel } from '../builder/src/types';

// RCA-002 (design/flutter-app-builder/research/SEARCH_KEYBOARD_BRIEF_CLAUDE.md,
// apps/keemart/output/rca/RCA-002-search-keyboard-ios.md — owner, iPhone Safari, /keemart: "i can
// not type search term"): iOS Safari only opens the soft keyboard when `.focus()` runs
// synchronously inside the tap's own event handler; Flutter web's lazy DOM `<input>` proxy
// creation pushed `.focus()` outside that window on the first tap. The repo already fixed this for
// create-forms (crud_form.ts:88-110, RCA-005) — this file proves the SAME gesture-bound
// `FocusNode`/`onTap: requestFocus()` bypass now applies to every generated SearchBar (list AND
// sections archetype), both as a generated-source structural check (real-generator-backed, child
// process, never mocks — same posture s1/s3/search_sections tests already take) and as a
// unit-level check on the new `generateSearchFocusTest` regression-guard generator (mirrors
// generateFocusTest, test.ts:611-647).

const REPO_ROOT = resolve(__dirname, '..');

interface ShellResult {
  status: number;
  stdout: string;
  stderr: string;
}

function sh(cmd: string): ShellResult {
  try {
    const stdout = execSync(cmd, { cwd: REPO_ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] });
    return { status: 0, stdout, stderr: '' };
  } catch (e: any) {
    return {
      status: typeof e.status === 'number' ? e.status : 1,
      stdout: e.stdout ? e.stdout.toString() : '',
      stderr: e.stderr ? e.stderr.toString() : '',
    };
  }
}

function validate(irPath: string, outDir: string): ShellResult {
  return sh(`npx ts-node --transpile-only builder/src/validate.ts ${irPath} ${outDir}`);
}

function generate(irPath: string, outDir: string): ShellResult {
  return sh(`npx ts-node --transpile-only builder/src/index.ts ${irPath} ${outDir}`);
}

describe('RCA-002 — real-generator-backed: keemart HomeScreen SearchBar carries the iOS-Safari keyboard bypass', () => {
  const homeScreenPath = resolve(REPO_ROOT, 'apps/keemart/output/app/lib/features/keemart/presentation/screens/home_screen.dart');

  test('the sections-archetype SearchBar (functional case) has focusNode + gesture onTap, plus FocusNode decl/dispose', () => {
    const src = readFileSync(homeScreenPath, 'utf8');
    expect(src).toContain('final _searchFocus = FocusNode();');
    expect(src).toContain('_searchFocus.dispose();');
    expect(src).toContain('focusNode: _searchFocus, onTap: () => _searchFocus.requestFocus(),');
    // NO autofocus anywhere (RCA-005: autofocus makes the real bug worse, never better).
    expect(src).not.toContain('autofocus');
  });

  test('search_focus_test.dart was generated and wires the same appRouter.go(...) + SearchBar focus/onTap assertions as generateFocusTest does for forms', () => {
    const f = resolve(REPO_ROOT, 'apps/keemart/output/app/test/search_focus_test.dart');
    expect(existsSync(f)).toBe(true);
    const src = readFileSync(f, 'utf8');
    expect(src).toContain("appRouter.go('/product');");
    expect(src).toContain('final bar = tester.widget<SearchBar>(find.byType(SearchBar));');
    expect(src).toContain('expect(bar.focusNode, isNotNull');
    expect(src).toContain('expect(bar.onTap, isNotNull');
    expect(src).toContain('expect(bar.focusNode!.hasFocus, isTrue');
  });

  test(
    '[search] gate still PASSes (keyboard bypass is additive, not a re-derivation of the search decision) and VALIDATION PASSED overall',
    () => {
      const r = validate('apps/keemart/input/keemart.ir.json', 'apps/keemart/output/app');
      expect(r.stdout).toMatch(/\[search\] PASS/);
      expect(r.stdout).toMatch(/VALIDATION PASSED/);
    },
    60_000,
  );
});

describe('RCA-002 — generateSearchFocusTest (pure generator, mirrors generateFocusTest)', () => {
  test('returns null for an app with no searchable screens', () => {
    const ir: FeatureModel = { name: 'bare', schemaVersion: '1', screens: [{ name: 'S', entity: 'X', type: 'list', state: 'S' }], entities: [{ name: 'X', fields: [{ name: 'id', type: 'String', required: true }] }], repositories: [] } as unknown as FeatureModel;
    expect(generateSearchFocusTest(ir, 'bloc')).toBeNull();
  });

  test('returns null for a riverpod app even when a screen resolves search (screen.ts never wires the bypass on riverpod — search itself is bloc-only)', () => {
    const ir: FeatureModel = JSON.parse(readFileSync(resolve(REPO_ROOT, 'apps/keemart/input/keemart.ir.json'), 'utf8'));
    expect(generateSearchFocusTest(ir, 'riverpod')).toBeNull();
  });

  test('a resolved searchable screen emits a testWidgets case asserting focusNode/onTap non-null and post-tap hasFocus', () => {
    const ir: FeatureModel = JSON.parse(readFileSync(resolve(REPO_ROOT, 'apps/keemart/input/keemart.ir.json'), 'utf8'));
    const out = generateSearchFocusTest(ir, 'bloc');
    expect(out).not.toBeNull();
    expect(out).toContain("testWidgets('HomeScreen: search bar wires a focus-bypass FocusNode (iOS Safari keyboard fix)'");
    expect(out).toContain("appRouter.go('/product');");
    expect(out).toContain('bar.focusNode!.hasFocus');
  });
});

describe('RCA-002 — negative control: a sections screen without a search section gets no FocusNode at all', () => {
  let workDir: string;

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 'rca-002-negative-'));
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  test(
    'stripping the `search` section from keemart HomeScreen regens with zero FocusNode/_searchFocus/SearchBar references and no search_focus_test.dart — the bypass never fires for a screen that never opted into search',
    () => {
      const baseIr: FeatureModel = JSON.parse(readFileSync(resolve(REPO_ROOT, 'apps/keemart/input/keemart.ir.json'), 'utf8'));
      const home = (baseIr.screens ?? []).find((s: any) => s.name === 'HomeScreen');
      expect(home?.sections?.some((sec: any) => sec.type === 'search')).toBe(true);
      home!.sections = (home!.sections ?? []).filter((sec: any) => sec.type !== 'search');

      const irPath = join(workDir, 'negctrl.ir.json');
      writeFileSync(irPath, JSON.stringify(baseIr, null, 2));

      const outDir = join(workDir, 'out');
      expect(generate(irPath, outDir).status).toBe(0);
      const src = readFileSync(join(outDir, 'lib/features/keemart/presentation/screens/home_screen.dart'), 'utf8');
      expect(src).toContain('class HomeScreen extends StatelessWidget');
      expect(src).not.toContain('FocusNode');
      expect(src).not.toContain('_searchFocus');
      expect(src).not.toContain('SearchBar(');
      expect(existsSync(join(outDir, 'test/search_focus_test.dart'))).toBe(false);

      const r = validate(irPath, outDir);
      expect(r.stdout).toMatch(/\[search\] PASS/);
    },
    60_000,
  );
});
