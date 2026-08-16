import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { generateApp } from "./index";
import { oracleCoverage, oracleDirFor, loadOracle } from "./oracle";
import { isMoneyField, isPolicyRule, hasSplitGroups, splitParentEntities, splitGroupFor, listEntityName, tenantScopedEntities, hasAuth, hasAttachments, hasBudget, budgetOf, resolveBudget, auditedEntities, hasAudit, declaredExportScreens, resolveExport, exportableFields, hasLocale, hasOutbox, isSwiftUI } from "./operations";
import { fileName } from "./dart";

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

// S2: the Swift analogue of walk() above — a sibling, not a parametrized version of it, so the
// Flutter walk stays byte-for-byte untouched (brief §2.6 Open/Closed).
function walkSwift(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkSwift(p));
    else if (p.endsWith(".swift")) out.push(p);
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

// S2 (§6.3): the Swift analogue of archCheck above, for the [swiftarch] gate — a sibling function,
// not a shared/parametrized one, so archCheck's Flutter behavior stays byte-for-byte untouched
// (§2.6 Open/Closed). V1 rule (requirements §6.3): a Domain-layer file must not import
// SwiftUI/UIKit. S2's skeleton has no Domain/ files at all (App.swift/HelloView.swift are the
// platform entry point and a Features/ view respectively), so this passes vacuously today — it
// exists now so S3+ (which will add real Domain/ files) can't silently regress it later.
function swiftArchCheck(f: string, src: string): string | null {
  const rel = f.replace(/.*\/ios\//, "");
  if (rel.includes("/Domain/") && /^\s*import\s+(SwiftUI|UIKit)\b/m.test(src)) {
    return `Domain violation in ${rel}: imports SwiftUI/UIKit`;
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

// MF2 trust boundary, generated-side: any entity whose IR declares a `tenantId` field and a
// repository must have that repository's generated impl enforcing tenant isolation — the scoped
// snapshot marker set below (read filter + write stamp + session tenant + the list-query tail)
// NEVER appears in unscoped repos (repository_impl.ts gates every one of them), so any miss means
// a code path fell through to the unscoped branch and would leak one tenant's rows to another.
// Unlike the whole-app linters above, this is per-repo-file so a single unscoped impl can't hide
// behind another scoped one.
const TENANT_MARKERS = ["_inScope(", "_stampTenant(", "Session.instance.tenantId", "_items.where(_inScope)"];
function tenantCheck(ir: any, files: string[]): string[] {
  const issues: string[] = [];
  const scoped = new Set(tenantScopedEntities(ir).map((e) => e.name));
  if (!scoped.size) return issues;
  for (const repo of ir.repositories ?? []) {
    const entityName = listEntityName(repo);
    if (!entityName || !scoped.has(entityName)) continue;
    const declared = (ir.repositoryImpls ?? []).find((ri: any) => ri.contract === repo.name);
    const implBase = fileName(declared ? declared.name : `${repo.name}InMemoryImpl`);
    const f = files.find((p) => path.basename(p) === implBase);
    if (!f) {
      issues.push(`[tenant] repo '${repo.name}' (entity '${entityName}' has tenantId): generated impl '${implBase}' not found`);
      continue;
    }
    const src = fs.readFileSync(f, "utf8");
    for (const m of TENANT_MARKERS) {
      if (!src.includes(m)) issues.push(`[tenant] ${f}: missing '${m}' — tenant scoping not enforced on '${repo.name}'`);
    }
  }
  return issues;
}

// MF2 trust boundary, routing-side: an app declaring `attributes.auth` must boot to the persona
// gate and enforce per-role reachability — the guard scaffold (route.ts's auth branch) carries all
// four of these markers; once again each is gated on hasAuth, so a straight non-auth router that
// happened to keep `/login` would fail this check.
const AUTH_GUARD_MARKERS = ["kHomeRoutes", "guardPath", "AuthLoginScreen", "initialLocation: '/login'"];
function authGuardCheck(ir: any, files: string[]): string[] {
  if (!hasAuth(ir)) return [];
  const router = files.find((p) => path.basename(p) === "router.dart");
  if (!router) return [`[auth] app declares attributes.auth but no lib/core/router.dart exists`];
  const src = fs.readFileSync(router, "utf8");
  const missing = AUTH_GUARD_MARKERS.filter((m) => !src.includes(m));
  return missing.map((m) => `[auth] lib:core/router.dart missing '${m}' — auth guard not enforced`);
}

// validate.ts is handed the RAW IR read straight off disk — for an MF1 multi-feature IR
// (`"features": [...]`) that means `ir.entities` is undefined at the top level (entities live
// under `ir.features[].entities`; index.ts only builds the flattened/merged FeatureModel INSIDE
// generateApp, which validate.ts never sees). Every other per-entity gate here has the same
// pre-existing gap (documented: LEFTOVER_NOTES.md "G2b/M2" — moneyCheck/datepickerCheck/tenantCheck
// etc. all read `ir.entities` directly and vacuously no-op on a multi-feature IR). budgetCheck
// can't afford to inherit that silently: `attributes.budget` DOES live at the IR's top level for
// both shapes, so hasBudget(ir) is still true for a multi-feature IR, and a bare `ir.entities`
// lookup would flip from "vacuous pass" to an outright false FAIL (entity genuinely present, just
// unreachable at this path) — worse than silently skipping. Flatten locally rather than changing
// the other checks' pre-existing (out-of-scope) behavior.
function flattenedEntities(ir: any): any[] {
  if (Array.isArray(ir.entities)) return ir.entities;
  if (Array.isArray(ir.features)) return ir.features.flatMap((f: any) => f.entities ?? []);
  return [];
}

function flattenedScreens(ir: any): any[] {
  if (Array.isArray(ir.screens)) return ir.screens;
  if (Array.isArray(ir.features)) return ir.features.flatMap((f: any) => f.screens ?? []);
  return [];
}

// L3: `audited: true` is declared inside entities[] (feature-local, not an app-level attribute
// like budget), so it needs the same flattening treatment for the raw multi-feature IR shape.
function flattenedIr(ir: any): any {
  return { ...ir, entities: flattenedEntities(ir), screens: flattenedScreens(ir) };
}

// MF5: a declared `attributes.budget` must (a) resolve against a real entity + three actual Money
// fields (operations.ts's resolveBudget — mirrors [split]'s per-group structural validity check)
// and (b) actually emit core/budget.dart — mirrors [attachment]'s presence check. Deliberately no
// oracle requirement here (unlike [split]/[verdict]): BudgetLine is a pure calculation, not a
// RuleModel — see the task report for why a unit test (budget_test.dart) is the chosen proof
// instead of an oracle file.
function budgetCheck(ir: any, files: string[]): string[] {
  if (!hasBudget(ir)) return [];
  const issues: string[] = [];
  const resolved = resolveBudget({ ...ir, entities: flattenedEntities(ir) });
  if (!resolved) {
    const model = budgetOf(ir);
    issues.push(
      `[budget] attributes.budget declares entity '${model?.entity}' (limit='${model?.limitField}', committed='${model?.committedField}', actual='${model?.actualField}') but it does not resolve to an existing entity with three actual Money fields — unverifiable`,
    );
    return issues;
  }
  if (!files.some((f) => f.endsWith("/core/budget.dart"))) {
    issues.push(`[budget] app declares attributes.budget but generated output has no core/budget.dart (BudgetLine)`);
  }
  return issues;
}

// L3: every entity that opts into `audited: true` requires `attributes.auth` — an AuditEvent's
// `actor` is the signed-in Session's actorId (repository_impl.ts), so an audited entity with no
// real identity source would silently log a lie about who acted; types.ts's EntityModel.audited
// doc comment states this as a hard requirement, not an implicit assumption. When resolved, the
// app must actually emit core/audit.dart + core/audit_log_screen.dart — mirrors [attachment].
function auditCheck(ir: any, files: string[]): string[] {
  const flat = flattenedIr(ir);
  if (!hasAudit(flat)) return [];
  const issues: string[] = [];
  const audited = auditedEntities(flat);
  if (!hasAuth(flat)) {
    const names = audited.map((e: any) => e.name).join(", ");
    issues.push(
      `[audit] entit${audited.length === 1 ? "y" : "ies"} '${names}' declare audited: true but the app has no attributes.auth — an audit event's actor requires a real signed-in identity`,
    );
  }
  if (!files.some((f) => f.endsWith("/core/audit.dart"))) {
    issues.push(`[audit] app has audited entities but generated output has no core/audit.dart (AuditEvent/recordMutation/AuditLog)`);
  }
  if (!files.some((f) => f.endsWith("/core/audit_log_screen.dart"))) {
    issues.push(`[audit] app has audited entities but generated output has no core/audit_log_screen.dart (AuditLogScreen)`);
  }
  return issues;
}

// L3: every list screen that declares `export:` must resolve against a real `exported: bool`
// field (operations.ts's resolveExport) — mirrors [split]'s categoryField requirement. When at
// least one resolves, the app must emit core/export.dart. Also re-asserts, on the GENERATED
// screen source, that no secret-typed field ever became an export column — defense in depth
// behind exportableFields() already excluding them at generation time, same "prove it on the
// output, don't just trust the generator" posture [money]/[tenant] already take.
function exportCheck(ir: any, files: string[]): string[] {
  const flat = flattenedIr(ir);
  const declared = declaredExportScreens(flat);
  if (!declared.length) return [];
  const issues: string[] = [];
  let anyResolved = false;
  for (const screen of declared as any[]) {
    const resolved = resolveExport(flat, screen);
    if (!resolved) {
      issues.push(
        `[export] screen '${screen.name}' declares export: '${screen.export}' on entity '${screen.entity}' but that entity has no bool field named 'exported' — unverifiable`,
      );
      continue;
    }
    anyResolved = true;
    const secretFields = resolved.entity.fields.filter((f: any) => f.secret);
    if (secretFields.length) {
      const screenFile = files.find((f) => f.endsWith(`/${fileName(screen.name)}`));
      if (screenFile) {
        const src = fs.readFileSync(screenFile, "utf8");
        for (const sf of secretFields) {
          if (new RegExp(`'${sf.name}':`).test(src)) {
            issues.push(`[export] ${screenFile}: secret-typed field '${sf.name}' appears in an export row — must be excluded`);
          }
        }
      }
    }
  }
  if (anyResolved && !files.some((f) => f.endsWith("/core/export.dart"))) {
    issues.push(`[export] app has a resolved export screen but generated output has no core/export.dart (toCsv/toJson)`);
  }
  return issues;
}

// L4: a declared `attributes.locale` must emit the locale-aware AppStrings (both _en and _ar
// maps — proves infra.ts actually took the locale-aware branch, not the flat pre-L4 stub) and
// MaterialApp's locale/supportedLocales/localizationsDelegates wiring in main.dart — mirrors
// [auth]'s marker-based check on router.dart exactly.
const L10N_STRINGS_MARKERS = ["_en", "_ar", "static AppStrings of(BuildContext context)"];
// Pre-existing bug fix (unrelated to MF6, found while regenerating evidence samples): ba62b24
// (L4 RTL follow-up) made `locale:` conditional — "both" deliberately omits it now so the
// browser/OS locale resolves AR/RTL (G-L4-1) — but this marker list still required it
// unconditionally, so [l10n] FAILed on every "both" app (ledgerly/hr_service) since that fix
// landed. `onGenerateTitle:` is unconditional in every locale-aware branch, so it's the correct
// always-present marker instead.
const L10N_MAIN_MARKERS = ["onGenerateTitle:", "supportedLocales:", "localizationsDelegates:", "GlobalMaterialLocalizations.delegate"];
function l10nCheck(ir: any, files: string[]): string[] {
  if (!hasLocale(ir)) return [];
  const issues: string[] = [];
  const appStrings = files.find((f) => f.endsWith("/core/app_strings.dart"));
  if (!appStrings) {
    issues.push(`[l10n] app declares attributes.locale but generated output has no core/app_strings.dart`);
  } else {
    const src = fs.readFileSync(appStrings, "utf8");
    for (const m of L10N_STRINGS_MARKERS) {
      if (!src.includes(m)) issues.push(`[l10n] core/app_strings.dart missing '${m}' — not the locale-aware AppStrings`);
    }
  }
  const main = files.find((f) => f.endsWith("/main.dart"));
  if (!main) {
    issues.push(`[l10n] app declares attributes.locale but no lib/main.dart exists`);
  } else {
    const src = fs.readFileSync(main, "utf8");
    for (const m of L10N_MAIN_MARKERS) {
      if (!src.includes(m)) issues.push(`[l10n] lib/main.dart missing '${m}' — MaterialApp locale/RTL wiring not enforced`);
    }
  }
  return issues;
}

// MF6: attributes.outbox must emit core/outbox.dart (Outbox/OutboxMessage), and — mirrors
// [attachment]/[budget]'s "prove it on the output, don't just trust the generator" posture — at
// least one generated data/repositories/* impl must actually reference Outbox.instance.enqueue,
// not just declare the capability with no repo wired to it.
function outboxCheck(ir: any, files: string[]): string[] {
  if (!hasOutbox(ir)) return [];
  const issues: string[] = [];
  if (!files.some((f) => f.endsWith("/core/outbox.dart"))) {
    issues.push(`[outbox] app declares attributes.outbox but generated output has no core/outbox.dart (Outbox/OutboxMessage)`);
  }
  const referenced = files.some((f) => f.includes("/data/repositories/") && fs.readFileSync(f, "utf8").includes("Outbox.instance.enqueue"));
  if (!referenced) {
    issues.push(`[outbox] app declares attributes.outbox but no generated repository impl references Outbox.instance.enqueue`);
  }
  return issues;
}

// S1 (§3.1): platform=generation target; absent=flutter. Validates only the raw declared value —
// target dispatch (index.ts's generateApp) is a separate concern (§2.6 Single Responsibility) and
// is not touched here. Runs early (validateOutput calls this before the determinism regen below)
// since it's a cheap precondition check on the IR itself, independent of any generated output.
const VALID_PLATFORMS = new Set(["flutter", "swiftui"]);
function platformCheck(ir: any): string[] {
  const platform = ir?.attributes?.platform;
  if (platform === undefined) return [];
  if (!VALID_PLATFORMS.has(platform)) {
    return [`[platform] attributes.platform="${platform}" must be "flutter" or "swiftui" (absent=flutter)`];
  }
  return [];
}

// S2 (correction 3, §5.1.1): the generated Package.swift must declare `.iOS(.v17)` as the first
// `platforms: [` entry. `\s*` (not a literal space) tolerates any indentation/newline style the
// generator happens to use — the requirement is the declaration's presence, not its whitespace.
const SWIFTPKG_PLATFORM_RE = /platforms:\s*\[\s*\.iOS\(\.v17\)/;
function swiftPkgCheck(iosFiles: string[]): string[] {
  const pkgFile = iosFiles.find((f) => f.endsWith("/Package.swift"));
  if (!pkgFile || !SWIFTPKG_PLATFORM_RE.test(fs.readFileSync(pkgFile, "utf8"))) {
    return [`[swiftpkg] Package.swift missing or missing .iOS(.v17) platform declaration`];
  }
  return [];
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
  tenant: number;    // count of tenantId-carrying repos whose generated impl lacks the scoped marker set (MF2)
  auth: number;      // count of auth-guard markers missing from a declared-auth app's router (MF2)
  attachment: number; // count of attachment-capable apps missing core/attachment.dart (MF3)
  budget: number;    // count of budget-declaration issues: unresolved entity/fields, or missing core/budget.dart (MF5)
  audit: number;     // count of audit issues: audited entity with no auth, or missing core/audit.dart|audit_log_screen.dart (L3)
  exportGate: number; // count of export issues: unresolved export declaration, secret field in an export row, or missing core/export.dart (L3)
  l10n: number;      // count of l10n issues: AppStrings not locale-aware, or main.dart missing locale/RTL wiring (L4)
  outbox: number;    // count of outbox issues: missing core/outbox.dart, or no repo impl references Outbox.instance.enqueue (MF6)
  platform: number;  // count of invalid attributes.platform values — not "flutter"/"swiftui"/absent (S1)
  swiftpkg: number;  // count of Package.swift issues: missing file or missing .iOS(.v17) declaration (S2)
  swiftarch: number; // count of Swift Domain-layer files importing SwiftUI/UIKit (S2, §6.3)
  swiftdeterminism: number; // count of non-empty diffs between two swiftui generations of the same IR (S2)
  files: number;
  issues: string[];
}

// S2 (§6.3, §6.4): a swiftui-target IR emits ONLY <outDir>/ios — none of the Flutter-specific
// checks below (all of which assume <outDir>/lib exists, from `walk()` down to every individual
// xxxCheck) apply, and several would throw outright on a missing directory. A dedicated pipeline
// — not isSwiftUI branches threaded through every Flutter check — keeps the Flutter path in
// validateOutput byte-for-byte untouched (§2.6 Open/Closed).
function validateSwiftUIOutput(ir: any, outDir: string, irPath: string): ValidationResult {
  const issues: string[] = [];

  const platformIssues = platformCheck(ir);
  issues.push(...platformIssues);
  const platform = platformIssues.length;

  const iosDir = path.join(outDir, "ios");
  const iosFiles = walkSwift(iosDir);

  const swiftpkgIssues = swiftPkgCheck(iosFiles);
  issues.push(...swiftpkgIssues);
  const swiftpkg = swiftpkgIssues.length;

  const swiftarchIssues: string[] = [];
  for (const f of iosFiles) {
    const v = swiftArchCheck(f, fs.readFileSync(f, "utf8"));
    if (v) swiftarchIssues.push(`[swiftarch] ${v}`);
  }
  issues.push(...swiftarchIssues);
  const swiftarch = swiftarchIssues.length;

  // [swiftdeterminism]: regenerate once fresh and diff against the already-generated outDir/ios —
  // same "generate once, diff against outDir" perf posture as [determinism] below, applied to
  // ios/ instead of lib/. Unlike that check, this wraps the diff in try/catch — `diff` exits
  // non-zero when it finds a difference, which is the exact case this gate exists to report, not
  // an unexpected failure to crash on.
  const swiftdeterminismIssues: string[] = [];
  const tmpSwift = `${outDir}.swift.v1`;
  execSync(`npx ts-node --transpile-only builder/src/index.ts ${irPath} ${tmpSwift}`, { stdio: "pipe" });
  let swiftDiff = "";
  try {
    swiftDiff = execSync(`diff -r ${tmpSwift}/ios ${iosDir}`, { stdio: "pipe" }).toString();
  } catch (e: any) {
    swiftDiff = e.stdout ? e.stdout.toString() : String(e.message ?? e);
  }
  if (swiftDiff.trim() !== "") swiftdeterminismIssues.push(`[swiftdeterminism] ${swiftDiff.trim()}`);
  issues.push(...swiftdeterminismIssues);
  const swiftdeterminism = swiftdeterminismIssues.length;
  fs.rmSync(tmpSwift, { recursive: true, force: true });

  return {
    // Flutter-only gates: N/A for a swiftui-target IR (no lib/ output exists in S2) — vacuous
    // pass, not "unchecked", since nothing in this pipeline could ever produce a Flutter issue.
    determinism: true, headers: 0, secrets: 0, idioms: 0, arch: 0, oracle: 0, fidelity: 0, money: 0,
    datepicker: 0, verdict: 0, split: 0, tenant: 0, auth: 0, attachment: 0, budget: 0, audit: 0,
    exportGate: 0, l10n: 0, outbox: 0,
    platform, swiftpkg, swiftarch, swiftdeterminism,
    files: iosFiles.length, issues,
  };
}

export function validateOutput(ir: any, outDir: string, irPath = "builder/samples/expense.semantic.ir.json"): ValidationResult {
  // S2: dispatch to the dedicated Swift pipeline above — see its own comment for why this is an
  // early return rather than isSwiftUI branches threaded through the Flutter body below.
  if (isSwiftUI(ir)) {
    return validateSwiftUIOutput(ir, outDir, irPath);
  }

  const issues: string[] = [];

  // Platform (S1, §3.1): cheap precondition check on the declared IR value, before any generated
  // output exists to inspect — does not weaken or reorder any check below it.
  const platformIssues = platformCheck(ir);
  issues.push(...platformIssues);
  const platform = platformIssues.length;

  // Determinism — generate ONCE fresh and diff against the already-generated outDir/lib.
  // (Perf: previously generated twice to tmp1/tmp2; the workflow always validates a freshly
  // generated outDir, so one fresh generation + a diff against it is an equivalent check at half
  // the cost — ~30-60s saved per validate across the 11-sample sweep. TIMING_LOG.md.)
  const tmp1 = `${outDir}.v1`;
  execSync(`npx ts-node --transpile-only builder/src/index.ts ${irPath} ${tmp1}`, { stdio: "pipe" });
  const diff = execSync(`diff -r ${tmp1}/lib ${outDir}/lib`, { stdio: "pipe" }).toString();
  const determinism = diff.trim() === "";
  if (!determinism) issues.push(diff.trim());
  fs.rmSync(tmp1, { recursive: true, force: true });

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

  // Tenant scoping (MF2): every tenantId-carrying repo's impl must actually filter/stamp rows.
  const tenantIssues = tenantCheck(ir, files);
  issues.push(...tenantIssues);
  const tenant = tenantIssues.length;

  // Auth guard (MF2): a declared-auth app must boot to the persona gate and route per-role.
  const authIssues = authGuardCheck(ir, files);
  issues.push(...authIssues);
  const auth = authIssues.length;

  // Attachment/OCR port (MF3): an app that opts into attachments must actually emit
  // core/attachment.dart (the ReceiptOcrPort + mock) — mirrors [split]/[money]: the gate proves
  // the capability is present, not just that the IR declares it.
  const attachmentIssues: string[] = [];
  if (hasAttachments(ir) && !files.some((f) => f.endsWith("/core/attachment.dart"))) {
    attachmentIssues.push("[attachment] app declares attributes.attachments but generated output has no core/attachment.dart (ReceiptOcrPort + mock)");
  }
  issues.push(...attachmentIssues);
  const attachment = attachmentIssues.length;

  // Budget/quota (MF5): a declared budget must resolve to a real entity + three Money fields and
  // actually emit core/budget.dart.
  const budgetIssues = budgetCheck(ir, files);
  issues.push(...budgetIssues);
  const budget = budgetIssues.length;

  // Audit log (L3): every audited entity requires attributes.auth; a resolved audit trail must
  // emit core/audit.dart + core/audit_log_screen.dart.
  const auditIssues = auditCheck(ir, files);
  issues.push(...auditIssues);
  const audit = auditIssues.length;

  // Export (L3): every declared export must resolve to a real `exported: bool` field, no
  // secret-typed field may appear in an export row, and a resolved export must emit
  // core/export.dart.
  const exportIssues = exportCheck(ir, files);
  issues.push(...exportIssues);
  const exportGate = exportIssues.length;

  // l10n (L4): a locale-aware app must emit locale-aware AppStrings + MaterialApp locale/RTL wiring.
  const l10nIssues = l10nCheck(ir, files);
  issues.push(...l10nIssues);
  const l10n = l10nIssues.length;

  // Outbox (MF6): a declared outbox must emit core/outbox.dart and be actually referenced by at
  // least one generated repository impl.
  const outboxIssues = outboxCheck(ir, files);
  issues.push(...outboxIssues);
  const outbox = outboxIssues.length;

  return {
    determinism, headers, secrets, idioms, arch, oracle, fidelity, money, datepicker, verdict, split,
    tenant, auth, attachment, budget, audit, exportGate, l10n, outbox, platform,
    // Swift-only gates: N/A for a flutter-target IR (no ios/ output exists) — vacuous pass, same
    // reasoning as the Flutter-only fields validateSwiftUIOutput above zeroes out.
    swiftpkg: 0, swiftarch: 0, swiftdeterminism: 0,
    files: files.length, issues,
  };
}

function main() {
  const irPath = process.argv[2] ?? "builder/samples/expense.semantic.ir.json";
  const outDir = process.argv[3] ?? "builder/output/generated_app";
  const ir = JSON.parse(fs.readFileSync(irPath, "utf8"));
  const r = validateOutput(ir, outDir, irPath);

  // S2: a swiftui-target IR only ever populates platform/swiftpkg/swiftarch/swiftdeterminism —
  // printing the full Flutter gate list below would report misleading PASSes for checks that
  // never ran (no oracle coverage was verified, no money check ran, etc.) against ios/ output.
  if (isSwiftUI(ir)) {
    console.log(`[platform] ${r.platform === 0 ? "PASS" : "FAIL (" + r.platform + ")"}`);
    console.log(`[swiftpkg] ${r.swiftpkg === 0 ? "PASS" : "FAIL (" + r.swiftpkg + ")"}`);
    console.log(`[swiftarch] ${r.swiftarch === 0 ? "PASS" : "FAIL (" + r.swiftarch + ")"}`);
    console.log(`[swiftdeterminism] ${r.swiftdeterminism === 0 ? "PASS" : "FAIL (" + r.swiftdeterminism + ")"} across ${r.files} files`);
    const swiftFailed = r.platform + r.swiftpkg + r.swiftarch + r.swiftdeterminism > 0;
    console.log(swiftFailed ? "\nVALIDATION FAILED" : "\nVALIDATION PASSED");
    process.exit(swiftFailed ? 1 : 0);
  }

  console.log(`[platform] ${r.platform === 0 ? "PASS" : "FAIL (" + r.platform + ")"}`);
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
  console.log(`[tenant] ${r.tenant === 0 ? "PASS" : "FAIL (" + r.tenant + ")"}`);
  console.log(`[auth] ${r.auth === 0 ? "PASS" : "FAIL (" + r.auth + ")"}`);
  console.log(`[attachment] ${r.attachment === 0 ? "PASS" : "FAIL (" + r.attachment + ")"}`);
  console.log(`[budget] ${r.budget === 0 ? "PASS" : "FAIL (" + r.budget + ")"}`);
  console.log(`[audit] ${r.audit === 0 ? "PASS" : "FAIL (" + r.audit + ")"}`);
  console.log(`[export] ${r.exportGate === 0 ? "PASS" : "FAIL (" + r.exportGate + ")"}`);
  console.log(`[l10n] ${r.l10n === 0 ? "PASS" : "FAIL (" + r.l10n + ")"}`);
  console.log(`[outbox] ${r.outbox === 0 ? "PASS" : "FAIL (" + r.outbox + ")"}`);
  const failed = !r.determinism || r.headers + r.secrets + r.idioms + r.arch + r.oracle + r.fidelity + r.money + r.datepicker + r.verdict + r.split + r.tenant + r.auth + r.attachment + r.budget + r.audit + r.exportGate + r.l10n + r.outbox + r.platform > 0;
  console.log(failed ? "\nVALIDATION FAILED" : "\nVALIDATION PASSED");
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
