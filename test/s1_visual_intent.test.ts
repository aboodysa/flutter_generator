import { execSync } from 'child_process';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

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

interface VisualSpec {
  radiusScale: { control: string; surface: string; container: string };
  baseSpacing: string;
  heroScale: 0 | 1 | 2;
  surfaceBias: 'plain' | 'card' | 'inherit';
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
      radiusScale: { control: 'AppRadius.roundedControl', surface: 'AppRadius.roundedSurface', container: 'AppRadius.roundedContainer' },
      baseSpacing: 'AppSpacing.md',
      heroScale: 1,
      surfaceBias: 'card',
    },
  },
  {
    app: 'hr_service',
    screenPath: '/leave-request/:id',
    dartFile: 'apps/hr_service/output/app/lib/features/hr_service/presentation/screens/leave_request_detail_screen.dart',
    spec: {
      radiusScale: { control: 'AppRadius.sharpControl', surface: 'AppRadius.sharpSurface', container: 'AppRadius.sharpContainer' },
      baseSpacing: 'AppSpacing.sm',
      heroScale: 2,
      surfaceBias: 'inherit',
    },
  },
  {
    app: 'ledgerly',
    screenPath: '/expense-claim',
    dartFile: 'apps/ledgerly/output/app/lib/features/expenses/presentation/screens/expense_claim_list_screen.dart',
    spec: {
      radiusScale: { control: 'AppRadius.softControl', surface: 'AppRadius.softSurface', container: 'AppRadius.softContainer' },
      baseSpacing: 'AppSpacing.lg',
      heroScale: 1,
      surfaceBias: 'card',
    },
  },
];

/** Count of the 4 structural VisualSpec dimensions that differ between two specs. */
function dimensionsDiffer(a: VisualSpec, b: VisualSpec): number {
  let n = 0;
  if (a.radiusScale.control !== b.radiusScale.control) n++;
  if (a.baseSpacing !== b.baseSpacing) n++;
  if (a.heroScale !== b.heroScale) n++;
  if (a.surfaceBias !== b.surfaceBias) n++;
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
