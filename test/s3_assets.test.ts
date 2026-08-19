import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';
import { assetFor, assetTargets, AssetSpec } from '../builder/src/composition';
import { assetRefCheck, aspectRatioCheck, assetsCheck } from '../builder/src/validate';
import { ScreenModel, FeatureModel } from '../builder/src/types';

// S3 (SPIKE_S3_REPORT.md §14) — procedural asset-resolution ladder tests. Mirrors
// test/s1_visual_intent.test.ts's conventions: real-generator-backed for the gate/determinism
// proofs (child-process invocation of the shipped CLIs, never mocks), direct unit tests for the
// pure selector and the S6-slice-3 checker functions (assetRefCheck/aspectRatioCheck), which have
// zero real matches by design (D2: v1 ships zero raster) and so need synthetic fixtures to prove
// their teeth per the S3 brief's verification step 6.

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

function canonicalHash(dir: string): string {
  const out = execSync('find . -type f -print | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256', {
    cwd: dir,
    encoding: 'utf8',
  });
  return out.trim().split(/\s+/)[0]!;
}

const emptyScreen = (overrides: Partial<ScreenModel>): ScreenModel => ({
  name: 'TestScreen',
  entity: 'Product',
  type: 'sections',
  state: 'Home',
  ...overrides,
});

const emptyIr: FeatureModel = { name: 'test', schemaVersion: '1' } as unknown as FeatureModel;

describe('S3 §14.1 — assetFor (pure selector)', () => {
  test('a screen with no sections resolves to null', () => {
    expect(assetFor(emptyScreen({ sections: undefined }), emptyIr)).toBeNull();
  });

  test('a sections screen whose sections carry no asset-bearing role resolves to null', () => {
    const screen = emptyScreen({ sections: [{ id: 'h', type: 'header' }, { id: 's', type: 'search' }, { id: 'd', type: 'divider' }] });
    expect(assetFor(screen, emptyIr)).toBeNull();
  });

  test('hero → {role:"hero", kind:"gradient", tokenRef:"AppColors.primary"} — the AppHeroBanner gradient already shipped in S2', () => {
    const screen = emptyScreen({ sections: [{ id: 'primaryHero', type: 'hero', title: 'Ready For School' }] });
    expect(assetFor(screen, emptyIr)).toEqual([{ role: 'hero', kind: 'gradient', tokenRef: 'AppColors.primary' }]);
  });

  test('promoBanner resolves to the SAME hero role as hero (shared focal-point slot, matches the sections gate\'s 0..1 hero-family cardinality)', () => {
    const screen = emptyScreen({ sections: [{ id: 'p', type: 'promoBanner', title: 'Weekend deals' }] });
    expect(assetFor(screen, emptyIr)).toEqual([{ role: 'hero', kind: 'gradient', tokenRef: 'AppColors.primary' }]);
  });

  test('productGrid → {role:"productGrid", kind:"omitted"} — explicit record, not silence (D2)', () => {
    const screen = emptyScreen({ sections: [{ id: 'g', type: 'productGrid' }] });
    expect(assetFor(screen, emptyIr)).toEqual([{ role: 'productGrid', kind: 'omitted' }]);
  });

  test('a screen with both hero and productGrid decides BOTH roles, in declared order — the multi-valued case a single-object return type would lose', () => {
    const screen = emptyScreen({
      sections: [
        { id: 'primaryHero', type: 'hero', title: 'Ready For School' },
        { id: 'g', type: 'productGrid' },
      ],
    });
    expect(assetFor(screen, emptyIr)).toEqual([
      { role: 'hero', kind: 'gradient', tokenRef: 'AppColors.primary' },
      { role: 'productGrid', kind: 'omitted' },
    ]);
  });

  test('an asset-bearing role nested one level inside a type:"section" grouping container is still resolved (depth-1 flatten, keemart\'s "offersGrid" shape)', () => {
    const screen = emptyScreen({
      sections: [
        { id: 'offers', type: 'section', title: 'Weekly offers', children: [{ id: 'offersHeader', type: 'sectionHeader', title: 'Weekly offers' }, { id: 'offersGrid', type: 'productGrid' }] },
      ],
    });
    expect(assetFor(screen, emptyIr)).toEqual([{ role: 'productGrid', kind: 'omitted' }]);
  });

  test('assetTargets keys only screens with a non-null decision, by screen name', () => {
    const ir: FeatureModel = {
      ...emptyIr,
      screens: [
        emptyScreen({ name: 'HomeScreen', sections: [{ id: 'g', type: 'productGrid' }] }),
        emptyScreen({ name: 'BareScreen', type: 'list', sections: undefined }),
      ],
    } as FeatureModel;
    const targets = assetTargets(ir);
    expect([...targets.keys()]).toEqual(['HomeScreen']);
    expect(targets.get('HomeScreen')).toEqual([{ role: 'productGrid', kind: 'omitted' }]);
  });
});

describe('S3 §14.5 — [assets] gate against the committed keemart proof app', () => {
  test('committed plan.json patterns.assets matches the expected re-derived decision', () => {
    const planPath = resolve(REPO_ROOT, 'apps/keemart/output/app/plan.json');
    const plan = JSON.parse(readFileSync(planPath, 'utf8'));
    const recorded: Record<string, AssetSpec[]> = plan.patterns?.assets ?? {};
    expect(recorded['/product']).toEqual([
      { role: 'hero', kind: 'gradient', tokenRef: 'AppColors.primary' },
      { role: 'productGrid', kind: 'omitted' },
    ]);
  });

  test(
    '[assets]/[asset-ref]/[aspect-ratio] all PASS on the committed keemart output',
    () => {
      const r = validate('apps/keemart/input/keemart.ir.json', 'apps/keemart/output/app');
      expect(r.stdout).toMatch(/\[assets\] PASS/);
      expect(r.stdout).toMatch(/\[asset-ref\] PASS/);
      expect(r.stdout).toMatch(/\[aspect-ratio\] PASS/);
      expect(r.stdout).toMatch(/VALIDATION PASSED/);
    },
    60_000,
  );
});

describe('S3 §14.6 — negative control: a deliberate path/URL/number in a tokenRef fails [assets]', () => {
  let workDir: string;

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 's3-assets-negative-'));
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  test(
    'a plan.json tokenRef smuggling a raster path is rejected — proves the gate has teeth without breaking the real app',
    () => {
      const irPath = resolve(REPO_ROOT, 'apps/keemart/input/keemart.ir.json');
      const outDir = join(workDir, 'out');
      expect(generate(irPath, outDir).status).toBe(0);

      const planPath = join(outDir, 'plan.json');
      const plan = JSON.parse(readFileSync(planPath, 'utf8'));
      expect(plan.patterns.assets['/product'][0].role).toBe('hero');
      plan.patterns.assets['/product'][0].tokenRef = 'assets/images/hero.png';
      writeFileSync(planPath, JSON.stringify(plan, null, 2));

      // main() only ever prints PASS/FAIL(count) per gate, never the individual issue strings, so
      // the precise message text is proven directly against assetsCheck below (unit-level), and
      // here we only assert the gate flips FAIL — the CLI-level, real-generator-backed half of the
      // proof (VALIDATION FAILED overall is collateral: plan-determinism/lockfile also legitimately
      // fail against a hand-edited plan.json in a throwaway temp dir, same posture s1's own
      // determinism test documents for [lockfile]).
      const r = validate(irPath, outDir);
      expect(r.status).not.toBe(0);
      expect(r.stdout).toMatch(/\[assets\] FAIL \(2\)/); // token-scan issue + re-derive/diff issue
      expect(r.stdout).toMatch(/VALIDATION FAILED/);
    },
    30_000,
  );

  test('a plan.json kind outside the v1 closed enum is rejected', () => {
    const irPath = resolve(REPO_ROOT, 'apps/keemart/input/keemart.ir.json');
    const outDir = join(workDir, 'out_kind');
    expect(generate(irPath, outDir).status).toBe(0);

    const planPath = join(outDir, 'plan.json');
    const plan = JSON.parse(readFileSync(planPath, 'utf8'));
    plan.patterns.assets['/product'][1].kind = 'generated';
    writeFileSync(planPath, JSON.stringify(plan, null, 2));

    const r = validate(irPath, outDir);
    expect(r.status).not.toBe(0);
    expect(r.stdout).toMatch(/\[assets\] FAIL/);
  });
});

describe('S3 §14.5 — assetsCheck message text (unit-level, proves the token/kind-scan wording directly)', () => {
  test('a raster-looking tokenRef and an out-of-enum kind each produce the expected message', () => {
    const workDir = mkdtempSync(join(tmpdir(), 's3-assets-check-'));
    try {
      const irPath = resolve(REPO_ROOT, 'apps/keemart/input/keemart.ir.json');
      const outDir = join(workDir, 'out');
      execSync(`npx ts-node --transpile-only builder/src/index.ts ${irPath} ${outDir}`, { cwd: REPO_ROOT, stdio: 'pipe' });

      const planPath = join(outDir, 'plan.json');
      const plan = JSON.parse(readFileSync(planPath, 'utf8'));
      plan.patterns.assets['/product'][0].tokenRef = 'assets/images/hero.png';
      plan.patterns.assets['/product'][1].kind = 'generated';
      writeFileSync(planPath, JSON.stringify(plan, null, 2));

      const ir = JSON.parse(readFileSync(irPath, 'utf8'));
      const issues: string[] = assetsCheck(ir, outDir, []);
      expect(issues.some((i: string) => i.includes('looks like a path/URL/number'))).toBe(true);
      expect(issues.some((i: string) => i.includes('not in the v1 closed enum'))).toBe(true);
    } finally {
      rmSync(workDir, { recursive: true, force: true });
    }
  }, 30_000);
});

describe('S3 §14.5 — assetRefCheck/aspectRatioCheck teeth (synthetic fixtures, S6 slice-3 gates)', () => {
  // No real generator emits Image.asset/AssetImage/AspectRatio (D2: zero raster in v1), so these
  // checks are naturally vacuous (0 matches) against every real app — proving they have real teeth
  // (SPIKE_S3_REPORT.md §14 verification step 6) requires feeding them synthetic file content
  // directly, independent of the generator.
  let workDir: string;
  let libDir: string;

  beforeEach(() => {
    workDir = mkdtempSync(join(tmpdir(), 's3-asset-ref-'));
    libDir = join(workDir, 'lib', 'presentation', 'screens');
    mkdirSync(libDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  test('assetRefCheck flags an Image.asset() path not declared in pubspec.yaml', () => {
    const f = join(libDir, 'home_screen.dart');
    writeFileSync(f, "Widget build() => Image.asset('assets/images/hero.png', fit: BoxFit.cover);");
    const issues = assetRefCheck(workDir, [f]);
    expect(issues.some((i) => i.includes('not declared in pubspec.yaml'))).toBe(true);
  });

  test('assetRefCheck flags an Image.asset() path declared in pubspec but missing on disk', () => {
    writeFileSync(join(workDir, 'pubspec.yaml'), 'flutter:\n  assets:\n    - assets/images/hero.png\n');
    const f = join(libDir, 'home_screen.dart');
    writeFileSync(f, "Widget build() => Image.asset('assets/images/hero.png', fit: BoxFit.cover);");
    const issues = assetRefCheck(workDir, [f]);
    expect(issues.some((i) => i.includes('does not exist on disk'))).toBe(true);
  });

  test('assetRefCheck passes when the asset is both declared and present on disk', () => {
    writeFileSync(join(workDir, 'pubspec.yaml'), 'flutter:\n  assets:\n    - assets/images/hero.png\n');
    mkdirSync(join(workDir, 'assets', 'images'), { recursive: true });
    writeFileSync(join(workDir, 'assets', 'images', 'hero.png'), 'fake-png-bytes');
    const f = join(libDir, 'home_screen.dart');
    writeFileSync(f, "Widget build() => Image.asset('assets/images/hero.png', fit: BoxFit.cover);");
    expect(assetRefCheck(workDir, [f])).toEqual([]);
  });

  test('assetRefCheck stays vacuous when no Image.asset/AssetImage constructor is emitted (today\'s real-app posture)', () => {
    const f = join(libDir, 'home_screen.dart');
    writeFileSync(f, "Widget build() => AppHeroBanner(headline: 'Ready For School');");
    expect(assetRefCheck(workDir, [f])).toEqual([]);
  });

  test('aspectRatioCheck flags an Image(...) with no fit: argument', () => {
    const f = join(libDir, 'home_screen.dart');
    writeFileSync(f, "Widget build() => Image.network('https://example.com/x.png');");
    const issues = aspectRatioCheck([f]);
    expect(issues.some((i) => i.includes('no fit: argument'))).toBe(true);
  });

  test('aspectRatioCheck flags AspectRatio(aspectRatio: <raw number>) as a raw IR-side literal', () => {
    const f = join(libDir, 'home_screen.dart');
    writeFileSync(f, "Widget build() => AspectRatio(aspectRatio: 1.5, child: const Placeholder());");
    const issues = aspectRatioCheck([f]);
    expect(issues.some((i) => i.includes('raw IR-side number'))).toBe(true);
  });

  test('aspectRatioCheck passes an Image(...fit:...) and an AspectRatio bound to a token expression', () => {
    const f = join(libDir, 'home_screen.dart');
    writeFileSync(f, "Widget build() => AspectRatio(aspectRatio: AppTokens.heroAspect, child: Image.network('https://example.com/x.png', fit: BoxFit.cover));");
    expect(aspectRatioCheck([f])).toEqual([]);
  });
});

describe('S3 §14.6 — determinism: two independent keemart regenerations are byte-identical', () => {
  test(
    'keemart (sections + assets present): two fresh regens produce identical output, diff -r empty',
    () => {
      const irPath = resolve(REPO_ROOT, 'apps/keemart/input/keemart.ir.json');
      const workDir = mkdtempSync(join(tmpdir(), 's3-determinism-'));
      try {
        const dirA = join(workDir, 'A');
        const dirB = join(workDir, 'B');
        expect(generate(irPath, dirA).status).toBe(0);
        expect(generate(irPath, dirB).status).toBe(0);

        expect(canonicalHash(dirA)).toEqual(canonicalHash(dirB));

        const diffResult = sh(`diff -r ${dirA} ${dirB}`);
        expect(diffResult.status).toBe(0);
        expect(diffResult.stdout.trim()).toBe('');
      } finally {
        rmSync(workDir, { recursive: true, force: true });
      }
    },
    30_000,
  );

  test(
    'validate.ts on a fresh keemart regeneration prints [determinism] PASS, [plan-determinism] PASS, [assets] PASS',
    () => {
      const irPath = resolve(REPO_ROOT, 'apps/keemart/input/keemart.ir.json');
      const workDir = mkdtempSync(join(tmpdir(), 's3-determinism-validate-'));
      try {
        const outDir = join(workDir, 'out');
        expect(generate(irPath, outDir).status).toBe(0);
        const r = validate(irPath, outDir);
        expect(r.stdout).toMatch(/\[determinism\] PASS/);
        expect(r.stdout).toMatch(/\[plan-determinism\] PASS/);
        expect(r.stdout).toMatch(/\[assets\] PASS/);
      } finally {
        rmSync(workDir, { recursive: true, force: true });
      }
    },
    30_000,
  );
});
