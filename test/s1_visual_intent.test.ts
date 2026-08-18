import { execSync } from 'child_process';
import { readFileSync, existsSync, mkdtempSync, writeFileSync, rmSync } from 'fs';
import { resolve, join } from 'path';
import { tmpdir } from 'os';

// S1 evidence-into-tests (design/flutter-app-builder/research/S1_EVIDENCE_TESTS_BRIEF_CLAUDE.md).
// Codifies the 5 review items from S1_PROOF_SCREENS.html into permanent, real-generator-backed
// regression tests — child-process invocation of the shipped builder/src CLIs, never mocks.

const REPO_ROOT = resolve(__dirname, '..');

interface ShellResult {
  status: number;
  stdout: string;
  stderr: string;
}

/** Run a shell command from the repo root, capturing output on both success and non-zero exit. */
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

function approve(irPath: string): ShellResult {
  return sh(`npx ts-node --transpile-only builder/src/approve.ts ${irPath}`);
}

/**
 * Canonical folder hash: sorted `find . -type f` + per-file sha256, folded into one digest.
 * Run with `cwd: dir` (not REPO_ROOT) so the `find .`-relative paths that get hashed are stable
 * across two differently-named temp directories with byte-identical content.
 */
function canonicalHash(dir: string): string {
  const out = execSync('find . -type f -print | LC_ALL=C sort | xargs shasum -a 256 | shasum -a 256', {
    cwd: dir,
    encoding: 'utf8',
  });
  return out.trim().split(/\s+/)[0]!;
}

function sha256File(filePath: string): string {
  const out = execSync(`shasum -a 256 ${filePath}`, { encoding: 'utf8' });
  return out.trim().split(/\s+/)[0]!;
}

interface VisualSpec {
  radiusScale: { control: string; surface: string; container: string; search: string; fab: string };
  spacing: { screen: string; section: string; itemGap: string; cardInset: string; fabInset: string };
  heroScale: 0 | 1 | 2;
  surfaceBias: 'plain' | 'card' | 'inherit';
  titleWeight: string;
}

interface ProofScreen {
  app: string;
  screenPath: string; // plan.json patterns.visual key (screenPath())
  dartFile: string; // repo-relative path to the generated screen file
  spec: VisualSpec;
}

// The 3 proof screens (SPIKE_S1_REPORT.md §14.6, S1_PROOF_SCREENS.html Part 2) — exact recorded
// VisualSpec per screen, reproduced from the committed apps/<app>/output/app/plan.json.
const PROOF_SCREENS: ProofScreen[] = [
  {
    app: 'tasks',
    screenPath: '/task',
    dartFile: 'apps/tasks/output/app/lib/features/tasks/presentation/screens/task_list_screen.dart',
    spec: {
      radiusScale: { control: 'AppRadius.roundedControl', surface: 'AppRadius.roundedSurface', container: 'AppRadius.roundedContainer', search: 'AppRadius.roundedSearch', fab: 'AppRadius.roundedFab' },
      spacing: { screen: 'AppSpacing.md', section: 'AppSpacing.md', itemGap: 'AppSpacing.md', cardInset: 'AppSpacing.md', fabInset: 'AppSpacing.md' },
      heroScale: 1,
      surfaceBias: 'card',
      titleWeight: '',
    },
  },
  {
    app: 'hr_service',
    screenPath: '/leave-request/:id',
    dartFile: 'apps/hr_service/output/app/lib/features/hr_service/presentation/screens/leave_request_detail_screen.dart',
    spec: {
      radiusScale: { control: 'AppRadius.sharpControl', surface: 'AppRadius.sharpSurface', container: 'AppRadius.sharpContainer', search: 'AppRadius.sharpSearch', fab: 'AppRadius.sharpFab' },
      spacing: { screen: 'AppSpacing.sm', section: 'AppSpacing.sm', itemGap: 'AppSpacing.sm', cardInset: 'AppSpacing.sm', fabInset: 'AppSpacing.sm' },
      heroScale: 2,
      surfaceBias: 'inherit',
      titleWeight: 'AppType.titleWeightStrong',
    },
  },
  {
    app: 'ledgerly',
    screenPath: '/expense-claim',
    dartFile: 'apps/ledgerly/output/app/lib/features/expenses/presentation/screens/expense_claim_list_screen.dart',
    spec: {
      radiusScale: { control: 'AppRadius.softControl', surface: 'AppRadius.softSurface', container: 'AppRadius.softContainer', search: 'AppRadius.softSearch', fab: 'AppRadius.softFab' },
      spacing: { screen: 'AppSpacing.lg', section: 'AppSpacing.lg', itemGap: 'AppSpacing.lg', cardInset: 'AppSpacing.lg', fabInset: 'AppSpacing.lg' },
      heroScale: 1,
      surfaceBias: 'card',
      titleWeight: '',
    },
  },
];

/** Count of the structural VisualSpec dimensions that differ between two specs (S1_TOKEN_RIGOR_
 *  BRIEF_CLAUDE.md grew the spec from 4 to 5 dimensions — radiusScale/spacing/heroScale/
 *  surfaceBias/titleWeight — search/fab ride inside radiusScale, not counted as separate
 *  dimensions here). */
function dimensionsDiffer(a: VisualSpec, b: VisualSpec): number {
  let n = 0;
  if (a.radiusScale.control !== b.radiusScale.control) n++;
  if (a.spacing.itemGap !== b.spacing.itemGap) n++;
  if (a.heroScale !== b.heroScale) n++;
  if (a.surfaceBias !== b.surfaceBias) n++;
  if (a.titleWeight !== b.titleWeight) n++;
  return n;
}

describe('S1 Item 1/2 — token agreement ("obviously different")', () => {
  for (const { app, screenPath, spec } of PROOF_SCREENS) {
    test(`${app} proof screen's committed plan.json patterns.visual matches the expected VisualSpec`, () => {
      const planPath = resolve(REPO_ROOT, `apps/${app}/output/app/plan.json`);
      const plan = JSON.parse(readFileSync(planPath, 'utf8'));
      const recorded = plan.patterns?.visual?.[screenPath];
      expect(recorded).toEqual(spec);
    });
  }

  test('the 3 proof screens have committed rendered goldens (Part 1 evidence)', () => {
    for (const { app } of PROOF_SCREENS) {
      expect(existsSync(resolve(REPO_ROOT, `apps/${app}/output/goldens`))).toBe(true);
    }
  });

  test('the 3 VisualSpecs are pairwise distinct on at least 2 of the 4 structural dimensions', () => {
    for (let i = 0; i < PROOF_SCREENS.length; i++) {
      for (let j = i + 1; j < PROOF_SCREENS.length; j++) {
        const a = PROOF_SCREENS[i]!;
        const b = PROOF_SCREENS[j]!;
        expect(dimensionsDiffer(a.spec, b.spec)).toBeGreaterThanOrEqual(2);
      }
    }
  });

  test(
    '[visualIntent] PASS on all 3 committed proof apps (fresh visualFor() re-derivation agrees with plan.json)',
    () => {
      for (const { app } of PROOF_SCREENS) {
        const r = validate(`apps/${app}/input/${app}.ir.json`, `apps/${app}/output/app`);
        expect(r.stdout).toMatch(/\[visualIntent\] PASS/);
        expect(r.stdout).toMatch(/VALIDATION PASSED/);
      }
    },
    60_000,
  );
});

describe('S1 Item 3 — token provenance (no hardcoded style)', () => {
  // A decided visualStyle value must only ever reach the generated screen as an AppRadius.*/
  // AppSpacing.* token reference — never a raw radius/color/padding numeric literal (the "one
  // rule that cannot break": visualStyle feeds the scoring/token layer, never a widget/asset).
  const RAW_LITERAL_PATTERNS: RegExp[] = [
    /BorderRadius\.circular\(\d/,
    /Radius\.circular\(\d/,
    /Color\(0x/,
    /EdgeInsets\.(all|only|fromLTRB)\(\d/,
  ];

  for (const { app, dartFile } of PROOF_SCREENS) {
    test(`${app} proof screen has zero raw radius/color/padding literals`, () => {
      const src = readFileSync(resolve(REPO_ROOT, dartFile), 'utf8');
      for (const pattern of RAW_LITERAL_PATTERNS) {
        expect(src).not.toMatch(pattern);
      }
    });

    test(`${app} proof screen references AppRadius.* and AppSpacing.* tokens`, () => {
      const src = readFileSync(resolve(REPO_ROOT, dartFile), 'utf8');
      expect(src).toMatch(/AppRadius\.(sharp|soft|rounded|pill)/);
      expect(src).toMatch(/AppSpacing\.(xs|sm|md|lg|xl)/);
    });

    test(`${app} proof screen's radius: argument is always an AppRadius.* token, never a raw number`, () => {
      const src = readFileSync(resolve(REPO_ROOT, dartFile), 'utf8');
      const radiusArgs = [...src.matchAll(/radius:\s*([^,)\s]+)/g)].map((m) => m[1]);
      expect(radiusArgs.length).toBeGreaterThan(0);
      for (const arg of radiusArgs) {
        expect(arg).toMatch(/^AppRadius\./);
      }
    });
  }
});

describe('S1 Item 4 — trust boundary (negative control)', () => {
  const HR_SERVICE_IR = resolve(REPO_ROOT, 'apps/hr_service/input/hr_service.ir.json');
  let workDir: string;

  beforeAll(() => {
    workDir = mkdtempSync(join(tmpdir(), 's1-trust-boundary-'));
  });

  afterAll(() => {
    rmSync(workDir, { recursive: true, force: true });
  });

  test(
    'an unattested visualStyle.hierarchy.requiresApproval=true blocks generation, then approve.ts unblocks it',
    () => {
      const ir = JSON.parse(readFileSync(HR_SERVICE_IR, 'utf8'));
      // screens[1] is LeaveRequestDetailScreen — the proof screen already carrying a visualStyle
      // fragment (S1 commit hr_service.input.ir.json). Same injection shape S1's own manual
      // negative control used: only requiresApproval, no actor — matches unapprovedElements()'s
      // `actor ?? "none"` fallback.
      expect(ir.screens[1].name).toBe('LeaveRequestDetailScreen');
      ir.screens[1].visualStyle.hierarchy.requiresApproval = true;

      const irPath = join(workDir, 'hr_service.unattested.ir.json');
      writeFileSync(irPath, JSON.stringify(ir, null, 2));
      const outDir = join(workDir, 'out_unattested');

      const blocked = generate(irPath, outDir);
      expect(blocked.status).not.toBe(0);
      const output = blocked.stdout + blocked.stderr;
      expect(output).toMatch(/\[approval\]/);
      expect(output).toMatch(/require human approval/);

      // No artifact written — the approval gate is the very first thing generateApp does, before
      // any fs.rmSync/mkdirSync/writeFileSync of the output tree.
      expect(existsSync(join(outDir, 'lib'))).toBe(false);
      expect(existsSync(join(outDir, 'plan.json'))).toBe(false);

      const approved = approve(irPath);
      expect(approved.status).toBe(0);
      expect(approved.stdout).toMatch(/human-attested/);

      const allowed = generate(irPath, outDir);
      expect(allowed.status).toBe(0);
      expect(existsSync(join(outDir, 'lib'))).toBe(true);
      expect(existsSync(join(outDir, 'plan.json'))).toBe(true);
    },
    30_000,
  );

  test('an out-of-v1-enum visualStyle.imagery value is rejected (S3-deferred field, D2/D3)', () => {
    const ir = JSON.parse(readFileSync(HR_SERVICE_IR, 'utf8'));
    expect(ir.screens[1].name).toBe('LeaveRequestDetailScreen');
    ir.screens[1].visualStyle.imagery = { value: 'photo' };

    const irPath = join(workDir, 'hr_service.imagery.ir.json');
    writeFileSync(irPath, JSON.stringify(ir, null, 2));
    const outDir = join(workDir, 'out_imagery');

    const rejected = generate(irPath, outDir);
    expect(rejected.status).not.toBe(0);
    const output = rejected.stdout + rejected.stderr;
    expect(output).toMatch(/additional propert/i);
  });
});

describe('S1 Item 5 — determinism (byte-identical regeneration)', () => {
  // hr_service proves S1's own fragment is deterministic; todo.ir.json (no visualStyle at all)
  // proves the absent-fragment path is still byte-identical — the other half of the additivity
  // guarantee (D2: "absent = today's output byte-identical").
  const CASES: Array<{ label: string; irPath: string }> = [
    { label: 'hr_service (visualStyle present)', irPath: resolve(REPO_ROOT, 'apps/hr_service/input/hr_service.ir.json') },
    { label: 'todo (legacy, no visualStyle)', irPath: resolve(REPO_ROOT, 'builder/samples/todo.ir.json') },
  ];

  for (const { label, irPath } of CASES) {
    const irSha = sha256File(irPath);

    test(
      `${label}: two independent regenerations are byte-identical (input IR sha256=${irSha})`,
      () => {
        const workDir = mkdtempSync(join(tmpdir(), 's1-determinism-'));
        try {
          const dirA = join(workDir, 'A');
          const dirB = join(workDir, 'B');
          expect(generate(irPath, dirA).status).toBe(0);
          expect(generate(irPath, dirB).status).toBe(0);

          const hashA = canonicalHash(dirA);
          const hashB = canonicalHash(dirB);
          // Same key ("hash") on both sides so a mismatch's jest diff still shows the stable
          // input-IR sha256 alongside the two divergent canonical hashes.
          expect({ irSha, hash: hashA }).toEqual({ irSha, hash: hashB });

          const diffResult = sh(`diff -r ${dirA} ${dirB}`);
          expect(diffResult.status).toBe(0);
          expect(diffResult.stdout.trim()).toBe('');
        } finally {
          rmSync(workDir, { recursive: true, force: true });
        }
      },
      30_000,
    );
  }

  test(
    'validate.ts on a fresh regeneration prints [plan-determinism] PASS and [visualIntent] PASS',
    () => {
      const workDir = mkdtempSync(join(tmpdir(), 's1-determinism-validate-'));
      try {
        const irPath = resolve(REPO_ROOT, 'apps/hr_service/input/hr_service.ir.json');
        const outDir = join(workDir, 'out');
        expect(generate(irPath, outDir).status).toBe(0);

        // [lockfile] is expected to FAIL here (a throwaway temp dir never ran `flutter pub get`,
        // so it has no pubspec.lock) — this test only asserts the 3 determinism/visual gates the
        // brief scopes, not the full validator suite.
        const r = validate(irPath, outDir);
        expect(r.stdout).toMatch(/\[determinism\] PASS/);
        expect(r.stdout).toMatch(/\[plan-determinism\] PASS/);
        expect(r.stdout).toMatch(/\[visualIntent\] PASS/);
      } finally {
        rmSync(workDir, { recursive: true, force: true });
      }
    },
    30_000,
  );
});
