import { execSync } from 'child_process';
import { readFileSync, writeFileSync, mkdtempSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { searchFor, SearchSpec } from '../builder/src/composition';
import { ScreenModel, EntityModel, RepositoryModel, FeatureModel } from '../builder/src/types';

// RCA-001 (design/flutter-app-builder/research/SEARCH_SECTIONS_BRIEF_CLAUDE.md, owner-reported:
// "search does not work in keemart app"): the `sections` archetype's `search` section used to be
// decorative-only (composition.ts's searchFor was list-archetype-only) — this file proves the fix
// both at the pure-selector level (mirrors S3 assets test conventions: emptyScreen/emptyIr
// synthetic fixtures, no child process) and the real-generator-backed level (child-process
// invocation of the shipped builder/src CLIs, never mocks, same posture s1/s3 already take).

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

const productEntity = (overrides: Partial<EntityModel> = {}): EntityModel => ({
  name: 'Product',
  identity: { field: 'id' },
  fields: [
    { name: 'id', type: 'String', required: true },
    { name: 'title', type: 'String', required: true },
  ],
  primaryDisplayField: 'title',
  ...overrides,
} as EntityModel);

const productRepo: RepositoryModel = {
  name: 'ProductRepository',
  operations: [{ name: 'listProducts', returns: 'Future<List<Product>>', params: [] }],
};

const sectionsScreen = (overrides: Partial<ScreenModel> = {}): ScreenModel => ({
  name: 'HomeScreen',
  entity: 'Product',
  type: 'sections',
  state: 'Home',
  ...overrides,
});

describe('RCA-001 — searchFor (pure selector): sections archetype resolves search when declared', () => {
  test('list screen + primaryDisplayField + repo list — unchanged baseline behavior', () => {
    const screen: ScreenModel = { name: 'ProductListScreen', entity: 'Product', type: 'list', state: 'ProductList' };
    expect(searchFor(screen, productEntity(), productRepo)).toEqual<SearchSpec>({ enabled: true, field: 'title', mode: 'contains' });
  });

  test('sections screen with NO search section resolves null — pre-existing decorative-only screens stay untouched', () => {
    const screen = sectionsScreen({ sections: [{ id: 'h', type: 'header' }, { id: 'hero', type: 'hero' }] });
    expect(searchFor(screen, productEntity(), productRepo)).toBeNull();
  });

  test('sections screen declaring a top-level search section + resolvable entity → resolves a SearchSpec (RCA-001 fix)', () => {
    const screen = sectionsScreen({ sections: [{ id: 'search', type: 'search' }, { id: 'grid', type: 'productGrid' }] });
    expect(searchFor(screen, productEntity(), productRepo)).toEqual<SearchSpec>({ enabled: true, field: 'title', mode: 'contains' });
  });

  test('sections screen declaring search nested one level inside a type:"section" grouping container still resolves', () => {
    const screen = sectionsScreen({
      sections: [{ id: 'toolbar', type: 'section', children: [{ id: 'search', type: 'search' }] }],
    });
    expect(searchFor(screen, productEntity(), productRepo)).toEqual<SearchSpec>({ enabled: true, field: 'title', mode: 'contains' });
  });

  test('sections screen declares search but entity has NO primaryDisplayField → stays null (same guard search always had)', () => {
    const screen = sectionsScreen({ sections: [{ id: 'search', type: 'search' }] });
    const entityNoDisplayField = productEntity({ primaryDisplayField: undefined });
    expect(searchFor(screen, entityNoDisplayField, productRepo)).toBeNull();
  });

  test('sections screen declares search but primaryDisplayField points at a non-String field → stays null', () => {
    const screen = sectionsScreen({ sections: [{ id: 'search', type: 'search' }] });
    const entity = productEntity({
      fields: [{ name: 'id', type: 'String', required: true }, { name: 'count', type: 'int', required: true }],
      primaryDisplayField: 'count',
    });
    expect(searchFor(screen, entity, productRepo)).toBeNull();
  });

  test('hasSearchSection only looks at screen.sections, not screen.type — a non-sections screen with a stray sections[search] still resolves here; the [sections] gate is what rejects declaring sections on a non-"sections" archetype in the first place (validate.ts, "only a type:\\"sections\\" screen may")', () => {
    const screen: ScreenModel = { name: 'ProductDetailScreen', entity: 'Product', type: 'detail', state: 'ProductDetail', sections: [{ id: 'search', type: 'search' }] };
    expect(searchFor(screen, productEntity(), productRepo)).toEqual<SearchSpec>({ enabled: true, field: 'title', mode: 'contains' });
  });
});

describe('RCA-001 — real-generator-backed: keemart HomeScreen (sections + declared search) is now functional', () => {
  test('committed keemart plan.json resolves search for HomeScreen (/product) — the exact RCA-001 regression', () => {
    const planPath = resolve(REPO_ROOT, 'apps/keemart/output/app/plan.json');
    const plan = JSON.parse(readFileSync(planPath, 'utf8'));
    expect(plan.patterns?.search?.['/product']).toEqual({ enabled: true, field: 'title', mode: 'contains' });
  });

  test('committed keemart HomeScreen renders a controller-wired SearchBar and filters both sections off `filtered`', () => {
    const src = readFileSync(resolve(REPO_ROOT, 'apps/keemart/output/app/lib/features/keemart/presentation/screens/home_screen.dart'), 'utf8');
    expect(src).toContain('class HomeScreen extends StatefulWidget');
    expect(src).toContain("final _searchController = TextEditingController();");
    expect(src).toContain('controller: _searchController');
    expect(src).toContain("onChanged: (v) => setState(() => _query = v)");
    expect(src).toContain('final filtered = query.isEmpty ? state.products : state.products.where((item) => (item.title).toLowerCase().contains(query)).toList();');
    expect(src).toContain('itemCount: filtered.length');
    // KEYBOARD-ALL Task B: the sections branch must interpolate the typed query, list-branch
    // parity — it previously emitted the escaped-literal `\$_query` (P2 commit 99da57b bug),
    // which rendered the LITERAL text "No results for $_query" instead of what was typed.
    expect(src).toContain('No results for "$_query"');
    expect(src).not.toContain('No results for "\\$_query"');
  });

  test(
    '[search] gate PASSes on the committed keemart output (functional, not decorative)',
    () => {
      const r = validate('apps/keemart/input/keemart.ir.json', 'apps/keemart/output/app');
      expect(r.stdout).toMatch(/\[search\] PASS/);
      expect(r.stdout).toMatch(/VALIDATION PASSED/);
    },
    60_000,
  );
});

describe('RCA-001 — negative control: a sections screen without a search section stays a StatelessWidget no-op', () => {
  let workDir: string;

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 'rca-001-negative-'));
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  test(
    'stripping the `search` section from keemart HomeScreen regens a StatelessWidget with no controller and no SearchBar at all',
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
      expect(src).not.toContain('SearchBar(');
      expect(src).not.toContain('_searchController');
      expect(src).not.toContain('_query');

      const plan = JSON.parse(readFileSync(join(outDir, 'plan.json'), 'utf8'));
      expect(plan.patterns?.search?.['/product']).toBeUndefined();

      const r = validate(irPath, outDir);
      expect(r.stdout).toMatch(/\[search\] PASS/);
    },
    60_000,
  );
});
