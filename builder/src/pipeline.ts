import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { generateApp } from "./index";
import { validateOutput } from "./validate";

/**
 * Execution Contract (the deterministic pipeline) — prove a generated app is valid:
 *   generate → pub get → analyze → test (goldens bootstrapped) → build web → validators → report.
 * This is the value layer; an async job queue wraps it later (build-web is the slow stage).
 */

export interface StageResult {
  stage: string;
  status: "pass" | "fail" | "skipped";
  detail: string;
}

export interface PipelineReport {
  stages: StageResult[];
  passed: boolean;
  outDir: string;
}

function runFlutter(args: string, cwd: string, timeoutMs = 300000): { ok: boolean; out: string } {
  try {
    const out = execSync(`flutter ${args}`, { cwd, encoding: "utf8", timeout: timeoutMs, stdio: "pipe" });
    return { ok: true, out };
  } catch (e: any) {
    return { ok: false, out: (e.stdout ?? "") + (e.stderr ?? "") };
  }
}

export function runPipeline(ir: any, outDir: string, irPath: string): PipelineReport {
  const stages: StageResult[] = [];

  // 1. Generate
  const gen = generateApp(ir, outDir, ir.schemaVersion ?? "1");
  stages.push({ stage: "generate", status: "pass", detail: `${gen.fileCount} files` });

  // 2. pub get
  const pg = runFlutter("pub get", outDir, 120000);
  stages.push({ stage: "pub-get", status: pg.ok ? "pass" : "fail", detail: pg.ok ? "dependencies resolved" : pg.out.slice(-300) });

  // 3. analyze
  const an = runFlutter("analyze", outDir, 120000);
  stages.push({ stage: "analyze", status: an.ok && !/error:|warning:/.test(an.out) ? "pass" : "fail", detail: an.out.slice(-300) });

  // 4. test (bootstrap goldens first — human reviews baselines later per §20.3)
  runFlutter("test --update-goldens", outDir, 180000);
  const te = runFlutter("test", outDir, 180000);
  stages.push({ stage: "test", status: te.ok ? "pass" : "fail", detail: te.out.slice(-300) });

  // 5. build web (the slow stage — motivates the future async job model)
  const ws = runFlutter("create --platforms=web .", outDir, 120000); // add web/ scaffold if missing
  const bw = runFlutter("build web --release", outDir, 600000);
  stages.push({ stage: "build-web", status: ws.ok && bw.ok ? "pass" : "fail", detail: bw.ok ? "web build succeeded" : bw.out.slice(-300) });

  // 6. validators (determinism + secrets + headers + idioms + arch)
  const v = validateOutput(ir, outDir, irPath);
  const vPass = v.determinism && v.headers + v.secrets + v.idioms + v.arch === 0;
  stages.push({ stage: "validators", status: vPass ? "pass" : "fail", detail: v.issues.join("; ") || "determinism + secrets + headers + idioms + arch all pass" });

  return { stages, passed: stages.every((s) => s.status !== "fail"), outDir };
}

function main() {
  const irPath = process.argv[2] ?? "builder/samples/expense.semantic.ir.json";
  const outDir = process.argv[3] ?? "builder/output/pipeline";
  const ir = JSON.parse(fs.readFileSync(irPath, "utf8"));
  const report = runPipeline(ir, outDir, irPath);
  console.log(JSON.stringify(report, null, 2));
  process.exit(report.passed ? 0 : 1);
}

if (require.main === module) main();
