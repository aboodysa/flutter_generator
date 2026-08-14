import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { generateApp } from "./index";

/**
 * Validation pipeline — runs on generated output (determinism, headers, secrets, idioms, arch).
 * Exported as `validateOutput` so the CLI and the HTTP pipeline share it.
 */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".dart")) out.push(p);
  }
  return out;
}

// Architecture linter: dependency-direction rules over the feature-first layout.
function archCheck(f: string, src: string): string | null {
  const rel = f.replace(/.*\/lib\//, "");
  const layer = rel.split("/").slice(0, 2).join("/");
  const imports = [...src.matchAll(/import '([^']+)';/g)].map((m) => m[1] ?? "").filter(Boolean);
  if (layer.includes("/domain")) {
    const bad = imports.filter((i) =>
      i.startsWith("package:flutter/") || i.startsWith("package:dio") || i.startsWith("package:sqflite") ||
      i.includes("/data/") || i.includes("/presentation/") || i.includes("flutter_bloc") || i.includes("get_it"));
    if (bad.length) return `domain violation in ${rel}: ${bad.join(", ")}`;
  }
  if (layer.includes("/data")) {
    const bad = imports.filter((i) => i.includes("/presentation/"));
    if (bad.length) return `data→presentation in ${rel}: ${bad.join(", ")}`;
  }
  if (layer.includes("/presentation")) {
    const bad = imports.filter((i) => i.includes("/data/datasources") || i.includes("/data/repositories/"));
    if (bad.length) return `presentation→data-impl in ${rel}: ${bad.join(", ")}`;
    // Component registry (§8): screens must not hardcode tokens — consume registry components instead.
    if (/Colors\.|Color\(0x|Color\.fromRGBO|const Color\(/.test(src)) {
      return `presentation bypasses registry (raw color literal) in ${rel}`;
    }
  }
  return null;
}

export interface ValidationResult {
  determinism: boolean;
  headers: number;   // count of files missing the header
  secrets: number;   // count of files with secret literals
  idioms: number;    // count of files with forbidden idioms
  arch: number;      // count of files with arch violations
  files: number;
  issues: string[];
}

export function validateOutput(ir: any, outDir: string, irPath = "builder/samples/expense.semantic.ir.json"): ValidationResult {
  const issues: string[] = [];

  // Determinism — generate twice, diff.
  const tmp1 = `${outDir}.v1`, tmp2 = `${outDir}.v2`;
  execSync(`npx ts-node --transpile-only builder/src/index.ts ${irPath} ${tmp1}`, { stdio: "pipe" });
  execSync(`npx ts-node --transpile-only builder/src/index.ts ${irPath} ${tmp2}`, { stdio: "pipe" });
  const diff = execSync(`diff -r ${tmp1}/lib ${tmp2}/lib`, { stdio: "pipe" }).toString();
  const determinism = diff.trim() === "";
  if (!determinism) issues.push(diff.trim());
  fs.rmSync(tmp1, { recursive: true, force: true });
  fs.rmSync(tmp2, { recursive: true, force: true });

  // Static checks.
  const files = walk(path.join(outDir, "lib"));
  let headers = 0, secrets = 0, idioms = 0, arch = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    if (!/\[generated\] generator=/.test(src)) { issues.push(`[header] MISSING in ${f}`); headers++; }
    if (/(https?:\/\/[^'"\s]*@|dsn|sk_live_|api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{8,}|secret\s*[:=])/i.test(src)) { issues.push(`[secret] LITERAL in ${f}`); secrets++; }
    if (/dart\.library\.(html|io|js_interop|js_util)/.test(src)) { issues.push(`[idiom] conditional import in ${f}`); idioms++; }
    if (/catch\s*\(\s*_?\s*\)\s*\{\s*\}/.test(src)) { issues.push(`[idiom] swallowed empty catch in ${f}`); idioms++; }
    const a = archCheck(f, src);
    if (a) { issues.push(`[arch] ${a}`); arch++; }
  }

  return { determinism, headers, secrets, idioms, arch, files: files.length, issues };
}

function main() {
  const irPath = process.argv[2] ?? "builder/samples/expense.semantic.ir.json";
  const outDir = process.argv[3] ?? "builder/output/generated_app";
  const r = validateOutput(JSON.parse(fs.readFileSync(irPath, "utf8")), outDir, irPath);
  console.log(`[determinism] ${r.determinism ? "PASS (byte-identical)" : "FAIL"}`);
  console.log(`[headers] ${r.headers === 0 ? "PASS" : "FAIL (" + r.headers + ")"} across ${r.files} files`);
  console.log(`[secrets] ${r.secrets === 0 ? "PASS" : "FAIL (" + r.secrets + ")"}`);
  console.log(`[forbidden-idioms] ${r.idioms === 0 ? "PASS" : "FAIL (" + r.idioms + ")"}`);
  console.log(`[architecture] ${r.arch === 0 ? "PASS" : "FAIL (" + r.arch + ")"}`);
  const failed = !r.determinism || r.headers + r.secrets + r.idioms + r.arch > 0;
  console.log(failed ? "\nVALIDATION FAILED" : "\nVALIDATION PASSED");
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
