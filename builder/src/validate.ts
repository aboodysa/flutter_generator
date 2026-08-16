import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { generateApp } from "./index";
import { oracleCoverage, oracleDirFor, loadOracle } from "./oracle";
import { isMoneyField, isPolicyRule, hasSplitGroups, splitParentEntities, splitGroupFor } from "./operations";

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

// Strategy fidelity (P3-C4): the plan.json `strategy` a state artifact claims must match
// the "sealed"-ness of the template the generator actually emitted — catches the class of
// bug where the scoring function selects sealed-events but the generator silently falls
// back to enum-status (plan.json would then describe code that was never generated).
function stateStrategyFidelity(outDir: string): string[] {
  const planPath = path.join(outDir, "plan.json");
  if (!fs.existsSync(planPath)) return [`[fidelity] plan.json missing in ${outDir}`];
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const mismatches: string[] = [];
  for (const entry of plan.entries ?? []) {
    if (entry.schema !== "state") continue;
    const filePath = path.join(outDir, entry.file);
    if (!fs.existsSync(filePath)) {
      mismatches.push(`[fidelity] ${entry.artifact}: declared file missing (${entry.file})`);
      continue;
    }
    const src = fs.readFileSync(filePath, "utf8");
    const m = src.match(/template=(\S+)/);
    const template = m?.[1] ?? "<none>";
    const claimsSealed = entry.strategy === "sealed-events";
    const emitsSealed = /sealed/i.test(template);
    if (claimsSealed !== emitsSealed) {
      mismatches.push(`[fidelity] ${entry.artifact}: plan strategy='${entry.strategy}' but emitted template='${template}'`);
    }
  }
  return mismatches;
}

// P7-L1 ("Money never uses double"): every entity field declared `semanticType: "Money"` must
// never surface as a raw `double` field declaration anywhere in the generated output — that would
// mean some generator fell through to the generic double path instead of special-casing Money
// (silently reintroducing floating-point rounding error into a money amount).
function moneyCheck(ir: any, files: string[]): string[] {
  const moneyFieldNames = new Set<string>();
  for (const e of ir.entities ?? []) {
    for (const f of e.fields ?? []) {
      if (isMoneyField(f)) moneyFieldNames.add(f.name);
    }
  }
  if (!moneyFieldNames.size) return [];
  const issues: string[] = [];
  for (const name of moneyFieldNames) {
    const re = new RegExp(`\\bdouble\\??\\s+${name}\\b`);
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      if (re.test(src)) issues.push(`[money] field '${name}' emitted as double in ${f}`);
    }
  }
  return issues;
}

// G2 ("real date picker, not free-typed text"): a DateTime field's editable input (CRUD form or
// wizard step) must drive `showDatePicker`. The bug signature is precise and doesn't need to know
// which field/file is which: a bare TextField/TextFormField date input is the only place the
// generator ever emits `hintText: 'YYYY-MM-DD'` (list/detail's read-only display renders a Text,
// never a hinted input) — so that hint surviving in a file with no `showDatePicker` alongside it
// means some generator fell back to free-typed text instead of the picker.
function datepickerCheck(ir: any, files: string[]): string[] {
  const hasDateField = (ir.entities ?? []).some((e: any) => (e.fields ?? []).some((f: any) => f.type === "DateTime"));
  if (!hasDateField) return [];
  const issues: string[] = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    if (src.includes("hintText: 'YYYY-MM-DD'") && !src.includes("showDatePicker")) {
      issues.push(`[datepicker] bare TextField date input (no showDatePicker) in ${f}`);
    }
  }
  return issues;
}

// L2: a severity'd rule (see operations.ts's isPolicyRule) drives generated policy-verdict UI —
// stricter than the general [oracle] gate (which only requires SOME oracle coverage for every
// rule): a policy rule additionally needs a valid severity value and a non-empty plain-language
// message (an empty message would mean the whole point of a verdict — "employee sees plain-
// language reasons before submit" — silently fails at the UI layer, not caught by [oracle]).
const VALID_SEVERITIES = ["autoApprove", "warn", "requireJustification", "block"];
function verdictCheck(ir: any, oracleDir: string): string[] {
  const issues: string[] = [];
  for (const rule of ir.businessRules ?? []) {
    if (!isPolicyRule(rule)) continue;
    if (!VALID_SEVERITIES.includes(rule.severity)) {
      issues.push(`[verdict] rule '${rule.name}': invalid severity '${rule.severity}'`);
    }
    if (!rule.message || !String(rule.message).trim()) {
      issues.push(`[verdict] rule '${rule.name}': severity '${rule.severity}' requires a non-empty message`);
    }
    const oracle = loadOracle(rule.name, oracleDir);
    if (!oracle || !oracle.cases || oracle.cases.length === 0) {
      issues.push(`[verdict] rule '${rule.name}': severity'd rule missing/zero-case oracle — unverifiable`);
    }
  }
  return issues;
}

// MF4: validateSplit isn't a RuleModel (operations.ts's splitGroupFor doc comment covers why), so
// it can't reuse oracleCoverage/verdictCheck's per-rule-name iteration — this checks the ONE
// shared oracle (Split.oracle.json) that every split group's UI/domain tests compile from, plus
// that each split group actually has a category field to render (without one the "Split" section
// and detail breakdown would silently fall back to a placeholder label — see splitGroupFor).
function splitCheck(ir: any, oracleDir: string): string[] {
  const issues: string[] = [];
  if (!hasSplitGroups(ir)) return issues;
  const oracle = loadOracle("Split", oracleDir);
  if (!oracle || !oracle.cases || oracle.cases.length === 0) {
    issues.push(`[split] app declares a split group but is missing/has zero-case Split.oracle.json — unverifiable`);
  }
  for (const parent of splitParentEntities(ir)) {
    const group = splitGroupFor(parent, ir);
    if (group && !group.categoryField) {
      issues.push(`[split] entity '${group.child}' (split child of '${parent}') has no String category field — split UI cannot render a category label`);
    }
  }
  return issues;
}

export interface ValidationResult {
  determinism: boolean;
  headers: number;   // count of files missing the header
  secrets: number;   // count of files with secret literals
  idioms: number;    // count of files with forbidden idioms
  arch: number;      // count of files with arch violations
  oracle: number;    // count of business rules missing or with zero-case oracle coverage
  fidelity: number;  // count of state artifacts whose plan.json strategy doesn't match the emitted template
  money: number;     // count of money-declared fields emitted as double (P7-L1)
  datepicker: number; // count of DateTime fields rendered as a bare TextField, no showDatePicker (G2)
  verdict: number;   // count of severity'd rules with invalid severity, empty message, or missing oracle (L2)
  split: number;     // count of split-group issues: missing/zero-case Split oracle, or a split child with no category field (MF4)
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

  // Oracle coverage (§9.4): a business rule with no (or empty) oracle is unverified
  // generated code — the correctness boundary DESIGN §0 treats as non-negotiable.
  const oc = oracleCoverage(ir, oracleDirFor(irPath));
  for (const r of [...oc.missing, ...oc.empty]) issues.push(`[oracle] ${r}: missing/zero-case oracle — unverifiable`);
  const oracle = oc.missing.length + oc.empty.length;

  // Strategy fidelity (P3-C4): plan.json's declared per-state strategy vs the emitted template.
  const fidelityIssues = stateStrategyFidelity(outDir);
  issues.push(...fidelityIssues);
  const fidelity = fidelityIssues.length;

  // Money-never-double (P7-L1).
  const moneyIssues = moneyCheck(ir, files);
  issues.push(...moneyIssues);
  const money = moneyIssues.length;

  // Real date picker, not free-typed text (G2).
  const datepickerIssues = datepickerCheck(ir, files);
  issues.push(...datepickerIssues);
  const datepicker = datepickerIssues.length;

  // Policy verdicts (L2): severity'd rules need a valid severity, a non-empty message, and oracle
  // coverage — stricter than the general [oracle] gate above.
  const verdictIssues = verdictCheck(ir, oracleDirFor(irPath));
  issues.push(...verdictIssues);
  const verdict = verdictIssues.length;

  // Split/allocation (MF4): a declared split group needs oracle coverage for validateSplit and a
  // category field to render — stricter than the general [oracle] gate, which never sees this
  // (validateSplit isn't a business rule).
  const splitIssues = splitCheck(ir, oracleDirFor(irPath));
  issues.push(...splitIssues);
  const split = splitIssues.length;

  return { determinism, headers, secrets, idioms, arch, oracle, fidelity, money, datepicker, verdict, split, files: files.length, issues };
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
  console.log(`[oracle] ${r.oracle === 0 ? "PASS" : "FAIL (" + r.oracle + ")"}`);
  console.log(`[strategy-fidelity] ${r.fidelity === 0 ? "PASS" : "FAIL (" + r.fidelity + ")"}`);
  console.log(`[money] ${r.money === 0 ? "PASS" : "FAIL (" + r.money + ")"}`);
  console.log(`[datepicker] ${r.datepicker === 0 ? "PASS" : "FAIL (" + r.datepicker + ")"}`);
  console.log(`[verdict] ${r.verdict === 0 ? "PASS" : "FAIL (" + r.verdict + ")"}`);
  console.log(`[split] ${r.split === 0 ? "PASS" : "FAIL (" + r.split + ")"}`);
  const failed = !r.determinism || r.headers + r.secrets + r.idioms + r.arch + r.oracle + r.fidelity + r.money + r.datepicker + r.verdict + r.split > 0;
  console.log(failed ? "\nVALIDATION FAILED" : "\nVALIDATION PASSED");
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
