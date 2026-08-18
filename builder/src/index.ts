import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import { FeatureModel, AppModel, StatePlacementSpec } from "./types";
import { fileName, GenContext } from "./dart";
import { screenPath } from "./routing";
import { pkgName, buildSymbols, addAuthSymbols } from "./symbols";
import { enforceWriteAcl } from "./acl";
import { generateEntity } from "./generators/entity";
import { generateEnum } from "./generators/enum";
import { generateValueObject } from "./generators/valueobject";
import { generateRepository } from "./generators/repository";
import { generateModel } from "./generators/model";
import { generateState } from "./generators/state";
import { generateQuery } from "./generators/query";
import { generateWrapper } from "./generators/wrapper";
import { generateUseCase } from "./generators/usecase";
import { generateDatasource } from "./generators/datasource";
import { generateRepositoryImpl, generateInMemoryRepository } from "./generators/repository_impl";
import { generateScreen } from "./generators/screen";
import { generateStateMachine } from "./generators/state_machine";
import { generateForm } from "./generators/form";
import { generateRule } from "./generators/rule";
import { generateDi } from "./generators/di";
import { generateRoutes } from "./generators/route";
import { generateAppShell } from "./generators/app_shell";
import { shellFor, ShellPattern, searchTargets, SearchSpec, scrollTargets, ScrollSpec, actionsTargets, ActionSpec, statePlacementTargets, visualTargets, VisualSpec } from "./composition";
import { generateUnitTest, generateGoldenTest, generateFlowTest, generateCrudFlowTest, generateFocusTest, generateScrollTest, generateBackTest, generateQuickDecisionTest, generatePolicyTest, generateSplitTest, generateAuthTest, generateAttachmentTest, generateBudgetTest, generateAuditTest, generateL10nTest, generateOutboxTest, generateViewportSqueezeTest } from "./generators/test";
import { generateA11yTest, a11yTestFileName } from "./generators/a11y_test";
import { generateLocalization, generateTheme, generateConfig, generateSecrets, generateObservability, generateValidator, generateNoParams, generateMoney } from "./generators/infra";
import { generateComponents } from "./generators/components";
import { generatePubspec, generateMain, generateMultiMain, generateBarrel, generateWidgetTest } from "./generators/project";
import { decideArchitecture, ArchitectureDecision } from "./arch";
import { PlanEntry, GenerationPlan, dependsOnFor, tagForIrKey, validatePlanReferences, GenClass } from "./plan";
import { RegionConflict, checkOverwrite, userRegionHash } from "./region";
import { buildLockfile } from "./context";
import { unapprovedElements } from "./provenance";
import { loadOracle, oracleDirFor } from "./oracle";
import { generateOracleTest } from "./generators/oracle_test";
import { generateCrudFormScreen } from "./generators/crud_form";
import { generateDriftTable, generateHiveAdapter } from "./generators/persistence";
import { crudFormTargets, crudFormScreenName, listEntityName, hasMoneyFields, hasPolicyRules, policyEntities, policyRulesForEntity, hasSplitGroups, hasAuth, hasAttachments, resolveBudget, hasAudit, hasExport, hasOutbox, targetOf } from "./operations";
import { generateWebIndexHtml, generateWebManifest } from "./generators/web";
import { generatePolicyCore, generateEntityPolicy } from "./generators/policy";
import { generateSplitCore } from "./generators/split";
import { generateAttachmentCore } from "./generators/attachment";
import { generateBudgetCore } from "./generators/budget";
import { generateAuditCore } from "./generators/audit";
import { generateExportCore } from "./generators/export";
import { generateAuditLogScreen } from "./generators/audit_log_screen";
import { generateSession, generateAuthLoginScreen } from "./generators/auth";
import { generateOutboxCore } from "./generators/outbox";
import { generateSwiftUITarget } from "./generators/swiftui";

/**
 * Generator registry — the only place that maps artifact type → { schema, generator, layer, file name }.
 * Adding a generator = one entry; the dispatch core is closed for modification (OCP).
 */
interface RegistryEntry {
  irKey: string;
  schema: string;
  layer: string;
  generator: string; // stable generator id (plan metadata, §6.1)
  class: GenClass; // structural | pattern | semantic | novel
  generate: (item: any, ctx?: GenContext) => string;
  file: (item: any) => string;
  label: (item: any) => string;
}

const registry: RegistryEntry[] = [
  { irKey: "enums", schema: "enum", layer: "domain/entities", generator: "EnumGenerator", class: "structural", generate: generateEnum, file: (e) => fileName(e.name), label: (e) => e.name },
  { irKey: "valueObjects", schema: "valueobject", layer: "domain/entities", generator: "ValueObjectGenerator", class: "structural", generate: generateValueObject, file: (v) => fileName(v.name), label: (v) => v.name },
  { irKey: "queries", schema: "query", layer: "domain/entities", generator: "QueryGenerator", class: "structural", generate: generateQuery, file: (q) => fileName(q.name), label: (q) => q.name },
  { irKey: "wrappers", schema: "wrapper", layer: "domain/entities", generator: "WrapperGenerator", class: "structural", generate: generateWrapper, file: (w) => fileName(w.name), label: (w) => w.name },
  { irKey: "entities", schema: "entity", layer: "domain/entities", generator: "EntityGenerator", class: "structural", generate: generateEntity, file: (e) => fileName(e.name), label: (e) => e.name },
  { irKey: "repositories", schema: "repository", layer: "domain/repositories", generator: "RepositoryContractGenerator", class: "structural", generate: generateRepository, file: (r) => fileName(r.name), label: (r) => r.name },
  { irKey: "useCases", schema: "usecase", layer: "domain/usecases", generator: "UseCaseGenerator", class: "structural", generate: generateUseCase, file: (u) => fileName(u.name), label: (u) => u.name },
  { irKey: "datasources", schema: "datasource", layer: "data/datasources", generator: "DataSourceGenerator", class: "structural", generate: generateDatasource, file: (d) => fileName(d.name), label: (d) => d.name },
  { irKey: "repositoryImpls", schema: "repository_impl", layer: "data/repositories", generator: "RepositoryImplGenerator", class: "structural", generate: generateRepositoryImpl, file: (r) => fileName(r.name), label: (r) => r.name },
  { irKey: "states", schema: "state", layer: "presentation/state", generator: "StateGenerator", class: "pattern", generate: generateState, file: (s) => fileName(s.name), label: (s) => s.name },
  { irKey: "screens", schema: "screen", layer: "presentation/screens", generator: "ScreenGenerator", class: "pattern", generate: generateScreen, file: (s) => fileName(s.name), label: (s) => s.name },
  { irKey: "stateMachines", schema: "state_machine", layer: "domain/state_machines", generator: "StateMachineGenerator", class: "pattern", generate: generateStateMachine, file: (s) => fileName(s.name + "StateMachine"), label: (s) => s.name },
  { irKey: "forms", schema: "form", layer: "presentation/forms", generator: "FormGenerator", class: "pattern", generate: generateForm, file: (f) => fileName(f.name), label: (f) => f.name },
  { irKey: "businessRules", schema: "rule", layer: "domain/rules", generator: "RuleCodeGenerator", class: "semantic", generate: generateRule, file: (r) => fileName(r.name), label: (r) => r.name },
];

export interface GenerateResult {
  outDir: string;
  fileCount: number;
  scoring: string[];
  conflicts: RegionConflict[];
}

// --- generateApp() steps (SOLID review #11) --------------------------------------------------
// generateApp() is the documented composition root (§6.4: "I/O confined to index.ts") — that
// role is legitimate, but the *function* used to interleave write-ACL/approval gating, schema
// validation, per-artifact writes, region-conflict detection, font bundling, and plan-building
// in one 300+ line body. Split into named steps below; I/O stays exclusively in index.ts (these
// are private, unexported helpers — generateApp() is still the only *public* entry that writes).

// Bundle the Roboto + MaterialIcons fonts so `flutter test` golden runs render real text/icons,
// not the default test font's solid boxes.
function bundleFonts(outDir: string): void {
  const fontsSrc = path.join(__dirname, "..", "templates", "fonts");
  const fontsDst = path.join(outDir, "assets", "fonts");
  if (fs.existsSync(fontsSrc)) {
    fs.mkdirSync(fontsDst, { recursive: true });
    for (const f of fs.readdirSync(fontsSrc)) {
      if (f.endsWith(".ttf") || f.endsWith(".otf")) fs.copyFileSync(path.join(fontsSrc, f), path.join(fontsDst, f));
    }
  }
}

// Core (non-feature-scoped) files: DI, router, component registry, localization, theme, config,
// secrets, observability, validator.
function writeCore(ir: FeatureModel, ctx: GenContext, arch: ArchitectureDecision, coreDir: string, outDir: string, shell?: ShellPattern | null): { files: string[]; planEntries: PlanEntry[] } {
  const core: [string, string][] = [
    ["di.dart", generateDi(ir, ctx, arch)],
    ["router.dart", generateRoutes(ir, ctx, arch, shell)],
    ["components.dart", generateComponents(ir)],
    ["app_strings.dart", generateLocalization(ir)],
    ["theme.dart", generateTheme(ir)],
    ["config.dart", generateConfig(ir)],
    ["secrets.dart", generateSecrets(ir)],
    ["observability.dart", generateObservability(ir)],
    ["validator.dart", generateValidator(ir)],
  ];
  if ((ir.useCases ?? []).some((u) => u.paramType === "NoParams")) {
    core.push(["no_params.dart", generateNoParams(ir)]);
  }
  if (hasMoneyFields(ir)) {
    core.push(["money.dart", generateMoney(ir)]);
  }
  if (hasPolicyRules(ir)) {
    core.push(["policy.dart", generatePolicyCore()]);
  }
  if (hasSplitGroups(ir)) {
    core.push(["split.dart", generateSplitCore()]);
  }
  if (hasAttachments(ir)) {
    core.push(["attachment.dart", generateAttachmentCore()]);
  }
  // MF5: gated on resolveBudget succeeding (entity + all three fields actually resolve to Money),
  // not just the declaration — a malformed attributes.budget emits nothing here and is reported by
  // validate.ts's [budget] gate instead (see operations.ts's resolveBudget doc comment).
  if (resolveBudget(ir)) {
    core.push(["budget.dart", generateBudgetCore()]);
  }
  // L3: gated on hasExport succeeding (>=1 list screen's `export:` resolves against a real
  // `exported: bool` field), same defensive posture as budget — a declared-but-unresolved export
  // emits nothing here and is reported by validate.ts's [export] gate instead.
  if (hasExport(ir)) {
    core.push(["export.dart", generateExportCore()]);
  }
  // L3: gated on hasAudit (>=1 entity opts into `audited: true`). AuditLogScreen is app-level
  // (like session.dart/auth_login_screen.dart below) since it aggregates across every audited
  // entity regardless of which feature declared it.
  if (hasAudit(ir)) {
    core.push(["audit.dart", generateAuditCore()]);
    core.push(["audit_log_screen.dart", generateAuditLogScreen(ir, ctx)]);
  }
  // MF2: auth is app-level state, not a feature's domain. session.dart (Persona + Session
  // singleton + kPersonas list) and auth_login_screen.dart (persona-picker login) are emitted
  // once per app, next to the rest of core — non-auth apps stay byte-identical (the guards above
  // earlier in this file still return the exact same list for them).
  if (hasAuth(ir)) {
    core.push(["session.dart", generateSession(ir)]);
    core.push(["auth_login_screen.dart", generateAuthLoginScreen(ir, ctx)]);
  }
  // MF6: gated on hasOutbox (attributes.outbox: true). App-level like budget/locale above — every
  // outbox-enabled repo impl imports this single queue regardless of which entity it belongs to.
  if (hasOutbox(ir)) {
    core.push(["outbox.dart", generateOutboxCore()]);
  }
  // P1: gated on the composition layer having decided a shell exists (`shell` non-null) — never
  // re-derived here, same defensive posture as every other conditional core file above.
  if (shell) {
    core.push(["app_shell.dart", generateAppShell(shell)]);
  }
  const coreGenerator: Record<string, string> = {
    "di.dart": "DIGenerator",
    "router.dart": "RouteGenerator",
    "components.dart": "ComponentRegistryGenerator",
    "app_strings.dart": "LocalizationGenerator",
    "theme.dart": "ThemeGenerator",
    "config.dart": "ConfigGenerator",
    "secrets.dart": "SecretsGenerator",
    "observability.dart": "ObservabilityGenerator",
    "validator.dart": "ValidatorGenerator",
    "no_params.dart": "NoParamsGenerator",
    "money.dart": "MoneyGenerator",
    "policy.dart": "PolicyCoreGenerator",
    "split.dart": "SplitCoreGenerator",
    "attachment.dart": "AttachmentCoreGenerator",
    "budget.dart": "BudgetCoreGenerator",
    "export.dart": "ExportCoreGenerator",
    "audit.dart": "AuditCoreGenerator",
    "audit_log_screen.dart": "AuditLogScreenGenerator",
    "session.dart": "SessionGenerator",
    "auth_login_screen.dart": "AuthLoginScreenGenerator",
    "outbox.dart": "OutboxCoreGenerator",
    "app_shell.dart": "AppShellGenerator",
  };
  const files: string[] = [];
  const planEntries: PlanEntry[] = [];
  for (const [f, content] of core) {
    const p = path.join(coreDir, f);
    fs.writeFileSync(p, content);
    files.push(p);
    planEntries.push({
      artifact: `core:${f.replace(/\.dart$/, "")}`,
      generator: coreGenerator[f] ?? "CoreGenerator",
      schema: "core",
      layer: "core",
      file: path.relative(outDir, p),
      strategy: "default",
      dependsOn: [],
      mode: "deterministic",
      class: "structural",
    });
  }
  return { files, planEntries };
}

// Widget/unit/flow/golden tests + (when an oracle corpus exists) business-rule oracle tests.
// Note: only oracle-test file paths are pushed into the returned `files` — the standard 4 test
// files, like plan.json/builder.lock.json/barrel/main/pubspec, are accounted for by generateApp's
// G5: the web/ platform directory (index.html, manifest.json, icons) was never part of generator
// output — only lib/+test/+pubspec were. A full `rm -rf <outDir> && regenerate` (the normal
// clean-regen pattern) silently destroyed web/, forcing a manual `flutter create . --platforms
// web` follow-up every time (documented as a workaround in AGENTS.md — now obsolete). Idempotent:
// only writes web/ when it doesn't already exist, so a hand-customized web/ (custom icons, a
// tuned index.html) is never clobbered on regen — same "region"-style non-destructive philosophy
// the lib/ generators use for hand-edited code, applied to platform scaffold files instead.
// Icons/favicon are static Flutter template assets (identical across every `flutter create` for a
// given Flutter version) shipped once as generator assets (builder/assets/web-template/) and
// copied, not regenerated per app — index.html/manifest.json are the only per-app-name text, so
// those alone are true generator output (web.ts).
//
// Deliberately does NOT also emit analysis_options.yaml: doing so activates
// `package:flutter_lints/flutter.yaml`, which surfaced 12 pre-existing info-level lints
// (prefer_const_constructors, unnecessary_string_interpolations) that make `flutter analyze` exit
// non-zero — a real regression against the "clean analyze" bar every sample has held all session,
// and out of scope for "G5: emit web/". Tracked as a follow-up, not bundled into this fix.
function writeWebScaffold(outDir: string, pkg: string): string[] {
  const files: string[] = [];
  const webDir = path.join(outDir, "web");
  if (fs.existsSync(webDir)) return files;
  fs.mkdirSync(path.join(webDir, "icons"), { recursive: true });
  const indexFile = path.join(webDir, "index.html");
  fs.writeFileSync(indexFile, generateWebIndexHtml(pkg));
  files.push(indexFile);
  const manifestFile = path.join(webDir, "manifest.json");
  fs.writeFileSync(manifestFile, generateWebManifest(pkg));
  files.push(manifestFile);
  const assetDir = path.join(__dirname, "..", "assets", "web-template");
  const assets = ["favicon.png", "icons/Icon-192.png", "icons/Icon-512.png", "icons/Icon-maskable-192.png", "icons/Icon-maskable-512.png"];
  for (const rel of assets) {
    const dest = path.join(webDir, rel);
    fs.copyFileSync(path.join(assetDir, rel), dest);
    files.push(dest);
  }
  return files;
}

// "+9" fileCount constant instead (preserved as-is from before this split).
// MF1: `flowTestScope` (defaults to `ir` — single-feature callers pass nothing, unchanged
// behavior) scopes generateFlowTest/generateCrudFlowTest separately from the rest. Those two scan
// the WHOLE screens/repository array for "a detail screen"/"a CRUD target" and assume it's
// reachable from the app's home screen — true for one feature, false for a merged multi-feature
// model where the home screen (feature[0]'s) and some OTHER feature's detail/CRUD screen have no
// navigational relationship. generateWidgetTest/generateUnitTest/generateGoldenTest don't have
// this problem (they only ever look at `entities[0]`/`screens[0]`, which for a merged model is
// already feature[0]'s own — no scoping needed there).
function writeTests(ir: FeatureModel, arch: ArchitectureDecision, outDir: string, testDir: string, oracleDir: string | undefined, pkg: string, flowTestScope: FeatureModel = ir, ctx?: GenContext, ruleArtifactTag: (name: string) => string = (name) => `rule:${name}`): { files: string[]; planEntries: PlanEntry[] } {
  fs.mkdirSync(testDir, { recursive: true });
  const files: string[] = [];
  const planEntries: PlanEntry[] = [];

  const testFiles: [string, string, string][] = [
    ["widget_test.dart", generateWidgetTest(ir), "WidgetTestGenerator"],
    ["unit_test.dart", generateUnitTest(ir), "UnitTestGenerator"],
    ["flow_test.dart", generateFlowTest(flowTestScope), "FlowTestGenerator"],
    ["golden_test.dart", generateGoldenTest(ir, arch.stateManagement), "GoldenTestGenerator"],
    ["viewport_squeeze_test.dart", generateViewportSqueezeTest(ir, arch.stateManagement), "ViewportSqueezeTestGenerator"],
  ];
  for (const [f, content, generator] of testFiles) {
    fs.writeFileSync(path.join(testDir, f), content);
    planEntries.push({
      artifact: `test:${f.replace(/\.dart$/, "").replace(/_test$/, "")}`,
      generator,
      schema: "test",
      layer: "test",
      file: path.relative(outDir, path.join(testDir, f)),
      strategy: "default",
      dependsOn: [],
      mode: "deterministic",
      class: "structural",
    });
  }

  // A11yTestGenerator (DESIGN.md §15) — one file per declared screen, scoped against the full
  // `ir` (same reasoning as ViewportSqueezeTestGenerator: run unconditionally across every
  // screen, not just flowTestScope's reachable subset, since the 11-overflow precedent showed
  // low-attention screens are exactly the ones sampling would miss).
  if ((ir.screens ?? []).length) {
    const a11yTestDir = path.join(testDir, "a11y");
    fs.mkdirSync(a11yTestDir, { recursive: true });
    for (const screen of ir.screens ?? []) {
      const f = path.join(a11yTestDir, a11yTestFileName(screen));
      fs.writeFileSync(f, generateA11yTest(ir, screen, arch.stateManagement));
      files.push(f);
      planEntries.push({
        artifact: `test:a11y:${screen.name}`,
        generator: "A11yTestGenerator",
        schema: "test",
        layer: "test/a11y",
        file: path.relative(outDir, f),
        strategy: "default",
        dependsOn: [],
        mode: "deterministic",
        class: "structural",
      });
    }
  }

  // CRUD flow test (§5.2-F1 proof) — only when an entity actually has the full create/edit/
  // delete + detail-screen shape this test drives; unlike the four above, it's conditional so it
  // IS pushed into `files` (the "+9" constant only covers the always-emitted set).
  const crudFlow = generateCrudFlowTest(flowTestScope, arch.stateManagement);
  if (crudFlow) {
    const f = path.join(testDir, "crud_flow_test.dart");
    fs.writeFileSync(f, crudFlow);
    files.push(f);
    planEntries.push({
      artifact: "test:crud_flow",
      generator: "CrudFlowTestGenerator",
      schema: "test",
      layer: "test",
      file: path.relative(outDir, f),
      strategy: "default",
      dependsOn: [],
      mode: "deterministic",
      class: "structural",
    });
  }

  // RCA-005/RCA-006 regression guards: unlike flow_test.dart/crud_flow_test.dart, neither of these
  // depends on being reachable from the app's home screen (the focus test jumps straight to a
  // route via `appRouter.go`; the scroll test pumps a screen in isolation with a seeded provider)
  // — so both scope against the FULL `ir`, not `flowTestScope`, and cover every list screen / every
  // CRUD form even in a multi-feature app.
  const focusTest = generateFocusTest(ir, arch.stateManagement);
  if (focusTest) {
    const f = path.join(testDir, "focus_test.dart");
    fs.writeFileSync(f, focusTest);
    files.push(f);
    planEntries.push({
      artifact: "test:focus", generator: "FocusTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  const scrollTest = generateScrollTest(ir, arch.stateManagement);
  if (scrollTest) {
    const f = path.join(testDir, "scroll_test.dart");
    fs.writeFileSync(f, scrollTest);
    files.push(f);
    planEntries.push({
      artifact: "test:scroll", generator: "ScrollTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  // G3 regression guard — same "scope against the full ir, navigate via appRouter directly"
  // reasoning as focus/scroll above.
  const backTest = generateBackTest(ir, arch.stateManagement);
  if (backTest) {
    const f = path.join(testDir, "back_test.dart");
    fs.writeFileSync(f, backTest);
    files.push(f);
    planEntries.push({
      artifact: "test:back", generator: "BackTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  // LM6 regression guard — a review-queue entity's quick-decision button (screen.ts) actually
  // calls update() and re-renders, not just that it exists.
  const quickDecisionTest = generateQuickDecisionTest(ir, arch.stateManagement);
  if (quickDecisionTest) {
    const f = path.join(testDir, "quick_decision_test.dart");
    fs.writeFileSync(f, quickDecisionTest);
    files.push(f);
    planEntries.push({
      artifact: "test:quickDecision", generator: "QuickDecisionTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  // L2 regression guard — block prevents Save, warn allows it with a visible message,
  // requireJustification blocks until typed, waive requires a reason. Scoped against the full ir
  // (same reasoning as focus/scroll/back above) since policy verdicts live in the CRUD form, not
  // behind any particular navigation path.
  const policyTest = generatePolicyTest(ir);
  if (policyTest) {
    const f = path.join(testDir, "policy_test.dart");
    fs.writeFileSync(f, policyTest);
    files.push(f);
    planEntries.push({
      artifact: "test:policy", generator: "PolicyTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  // MF4 regression guard — pure-domain oracle cases for validateSplit plus one UI case per
  // split-capable entity (live running total, Save blocked/unblocked at the 100% boundary).
  const splitOracle = oracleDir ? loadOracle("Split", oracleDir) : null;
  const splitTest = generateSplitTest(ir, splitOracle);
  if (splitTest) {
    const f = path.join(testDir, "split_test.dart");
    fs.writeFileSync(f, splitTest);
    files.push(f);
    planEntries.push({
      artifact: "test:split", generator: "SplitTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  // MF3 regression guard — port-must-exist: attachment_test.dart references
  // ReceiptAttachment/ReceiptOcrPort/MockReceiptOcr/synthesizeAttachment directly (via the
  // generated.dart barrel), so a build that drops core/attachment.dart from index.ts fails to
  // compile the test — the stash-proof gate that no validator regex alone can fully guarantee.
  const attachmentTest = generateAttachmentTest(ir);
  if (attachmentTest) {
    const f = path.join(testDir, "attachment_test.dart");
    fs.writeFileSync(f, attachmentTest);
    files.push(f);
    planEntries.push({
      artifact: "test:attachment", generator: "AttachmentTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  // MF5 regression guard — pure-domain unit tests for BudgetLine's remaining/pctUsed/isOverLimit/
  // remainingAfter math (a calculation, not a business rule — no oracle, mirrors attachment_test's
  // precedent). References BudgetLine directly via the generated.dart barrel, so a build that
  // drops core/budget.dart fails to compile the test — the stash-proof gate.
  const budgetTest = generateBudgetTest(ir);
  if (budgetTest) {
    const f = path.join(testDir, "budget_test.dart");
    fs.writeFileSync(f, budgetTest);
    files.push(f);
    planEntries.push({
      artifact: "test:budget", generator: "BudgetTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  // L3 regression guard — recordMutation stamps who/what/before/after/reason/at, AuditLog is
  // append-only, toCsv/toJson quote/escape and stay row-shape-agnostic, and — the stash-proofed
  // case — a repo mutation on an already-exported row throws. References AuditEvent/AuditLog/
  // toCsv/toJson directly via the generated.dart barrel, so dropping core/audit.dart or
  // core/export.dart fails to compile the test.
  const auditTest = generateAuditTest(ir, ctx);
  if (auditTest) {
    const f = path.join(testDir, "audit_test.dart");
    fs.writeFileSync(f, auditTest);
    files.push(f);
    planEntries.push({
      artifact: "test:audit", generator: "AuditTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  // L4 regression guard — AppStrings.of swaps strings per locale; the app's first screen flips
  // Directionality per locale with no RTL overflow, AR+EN goldens captured. References AppStrings
  // directly, so dropping the locale-aware core/app_strings.dart fails to compile the test.
  const l10nTest = generateL10nTest(ir, arch.stateManagement);
  if (l10nTest) {
    const f = path.join(testDir, "l10n_test.dart");
    fs.writeFileSync(f, l10nTest);
    files.push(f);
    planEntries.push({
      artifact: "test:l10n", generator: "L10nTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }
  // MF6 regression guard — enqueue/markSent/markFailed+retry/FIFO replay order, plus the
  // stash-proofed case: a real generated repo's create() write-ahead-enqueues. References Outbox
  // directly via the generated.dart barrel, so dropping core/outbox.dart fails to compile the test.
  const outboxTest = generateOutboxTest(ir, ctx);
  if (outboxTest) {
    const f = path.join(testDir, "outbox_test.dart");
    fs.writeFileSync(f, outboxTest);
    files.push(f);
    planEntries.push({
      artifact: "test:outbox", generator: "OutboxTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }

  // MF2 regression guard — the full login/guard/tenant-sign-in flow for auth apps:
  // personas rendered, unauthenticated deep link → /login, tap → own home, denied area
  // → own home, sign-out → /login again. None of the boot tests above would catch a broken
  // redirect, so this one is scoped against the whole IR (auth is app-level state).
  const authTest = generateAuthTest(ir);
  if (authTest) {
    const f = path.join(testDir, "auth_test.dart");
    fs.writeFileSync(f, authTest);
    files.push(f);
    planEntries.push({
      artifact: "test:auth", generator: "AuthTestGenerator", schema: "test", layer: "test",
      file: path.relative(outDir, f), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural",
    });
  }

  // Oracle tests (§9.4): for each business rule with a non-empty oracle corpus, compile its
  // example/expected pairs into a Dart test. A rule with no (or empty) oracle stays unverified —
  // caught by validate.ts's oracle-coverage gate, not silently generated as "tested".
  if (oracleDir) {
    const rulesTestDir = path.join(testDir, "rules");
    for (const rule of ir.businessRules ?? []) {
      const oracle = loadOracle(rule.name, oracleDir);
      if (!oracle || oracle.cases.length === 0) continue;
      const entity = ir.entities.find((e) => e.name === rule.entity);
      if (!entity) continue;
      fs.mkdirSync(rulesTestDir, { recursive: true });
      const oracleFileName = fileName(rule.name).replace(/\.dart$/, "_oracle_test.dart");
      const f = path.join(rulesTestDir, oracleFileName);
      fs.writeFileSync(f, generateOracleTest(rule, oracle, entity, ir, pkg));
      files.push(f);
      planEntries.push({
        artifact: `oracle:${rule.name}`,
        generator: "RuleOracleTestGenerator",
        schema: "rule",
        layer: "test/rules",
        file: path.relative(outDir, f),
        strategy: "default",
        dependsOn: [ruleArtifactTag(rule.name)],
        mode: "semantic",
        class: "semantic",
      });
    }
  }

  return { files, planEntries };
}

// §5.2-F1/F2: synthesized create/edit form screens (one per CRUD-capable entity) + persistence
// schema files (drift table / hive adapter, when persistence != none). Neither is IR-declared —
// both are derived from the repository's CRUD surface via crudFormTargets()/listEntityName(),
// the single source shared with symbols.ts/route.ts/screen.ts so imports/routes/UI never drift.
function writeCrudExtras(ir: FeatureModel, ctx: GenContext, arch: ArchitectureDecision, featureRoot: string, outDir: string): { files: string[]; planEntries: PlanEntry[] } {
  const files: string[] = [];
  const planEntries: PlanEntry[] = [];

  const screensDir = path.join(featureRoot, "presentation", "screens");
  for (const target of crudFormTargets(ir).values()) {
    const entity = ir.entities.find((e) => e.name === target.entity);
    if (!entity) continue;
    const name = crudFormScreenName(target.entity);
    fs.mkdirSync(screensDir, { recursive: true });
    const f = path.join(screensDir, fileName(name));
    fs.writeFileSync(f, generateCrudFormScreen(target, entity, name, ctx));
    files.push(f);
    planEntries.push({
      artifact: `screen:${name}`,
      generator: "CrudFormGenerator",
      schema: "screen",
      layer: "presentation/screens",
      file: path.relative(outDir, f),
      strategy: "default",
      dependsOn: [`state:${target.screen.state}`],
      mode: "deterministic",
      class: "pattern",
    });
  }

  if (arch.persistence !== "none") {
    const localDir = path.join(featureRoot, "data", "local");
    const isSql = arch.persistence === "sql";
    for (const repo of ir.repositories ?? []) {
      const entityName = listEntityName(repo);
      const entity = entityName ? ir.entities.find((e) => e.name === entityName) : undefined;
      if (!entity) continue;
      fs.mkdirSync(localDir, { recursive: true });
      const content = isSql
        ? generateDriftTable(entity)
        : generateHiveAdapter(entity, ir.enums ?? [], ir.valueObjects ?? [], ir.entities.indexOf(entity));
      const f = path.join(localDir, fileName(entity.name).replace(/\.dart$/, isSql ? "_table.dart" : "_adapter.dart"));
      fs.writeFileSync(f, content);
      files.push(f);
      planEntries.push({
        artifact: `persistence:${entity.name}`,
        generator: "PersistenceGenerator",
        schema: "persistence",
        layer: "data/local",
        file: path.relative(outDir, f),
        strategy: arch.persistence,
        dependsOn: [`entity:${entity.name}`],
        mode: "deterministic",
        class: "structural",
      });
    }
  }

  return { files, planEntries };
}

const loadSchema = (n: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "schemas", `${n}.schema.json`), "utf8"));

// MF1: the registry-driven artifact loop (entities/repos/usecases/screens/...) + models +
// in-memory repo impls + CRUD extras (form screens, persistence schema) for ONE feature, rooted
// at featureRoot. Shared by the single-feature path (called once, artifactPrefix="") and the
// multi-feature path (called once per feature, artifactPrefix=`feature:<name>:`) — extracted so
// the two paths run the exact same logic instead of drifting two copies of it (single-feature
// output must stay byte-identical: artifactPrefix="" makes every prefixed string a no-op).
function writeFeatureArtifacts(
  feature: FeatureModel,
  ctx: GenContext,
  arch: ArchitectureDecision,
  featureRoot: string,
  outDir: string,
  ajv: Ajv,
  validators: Record<string, any>,
  check: (label: string, v: any, value: any) => void,
  existingUseCases: Map<string, string>,
  lastKnownHashes: Record<string, string>,
  conflicts: RegionConflict[],
  nextHashes: Record<string, string>,
  artifactPrefix = "",
): { files: string[]; planEntries: PlanEntry[] } {
  const files: string[] = [];
  const planEntries: PlanEntry[] = [];

  for (const entry of registry) {
    const tag = tagForIrKey(entry.irKey);
    const items = (feature as any)[entry.irKey] ?? [];
    for (const item of items) {
      check(`${entry.schema}:${entry.label(item)}`, validators[entry.schema], item);
      const dir = path.join(featureRoot, entry.layer);
      fs.mkdirSync(dir, { recursive: true });
      const f = path.join(dir, entry.file(item));
      const generated = entry.generate(item, ctx);
      let written = generated;
      if (entry.irKey === "useCases") {
        const fileName = entry.file(item);
        const existing = existingUseCases.get(fileName);
        if (existing !== undefined) {
          const conflict = checkOverwrite(existing, lastKnownHashes[fileName] ?? null, path.relative(outDir, f));
          if (conflict) {
            conflicts.push(conflict);
            written = existing; // preserve the user's hand-edited region
          }
        }
        const h = userRegionHash(written);
        if (h !== null) nextHashes[fileName] = h;
      }
      fs.writeFileSync(f, written);
      files.push(f);
      planEntries.push({
        artifact: `${artifactPrefix}${tag}:${item.name}`,
        generator: entry.generator,
        schema: entry.schema,
        layer: entry.layer,
        file: path.relative(outDir, f),
        strategy: tag === "state" ? arch.perStateStrategy.get(item.name) ?? "enum-status" : "default",
        dependsOn: dependsOnFor(entry.irKey, item).map((d) => `${artifactPrefix}${d}`),
        mode: entry.class === "semantic" ? "semantic" : "deterministic",
        class: entry.class,
      });
    }
  }

  for (const entity of feature.entities) {
    const override = (feature.models ?? []).find((m) => m.entity === entity.name);
    if (override) check(`model:${entity.name}`, ajv.compile(loadSchema("model")), override);
    const dir = path.join(featureRoot, "data/models");
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, fileName(entity.name).replace(/\.dart$/, "_model.dart"));
    fs.writeFileSync(f, generateModel(entity, override, ctx));
    files.push(f);
    planEntries.push({
      artifact: `${artifactPrefix}model:${entity.name}`,
      generator: "ModelGenerator",
      schema: "model",
      layer: "data/models",
      file: path.relative(outDir, f),
      strategy: "default",
      dependsOn: [`${artifactPrefix}entity:${entity.name}`],
      mode: "deterministic",
      class: "structural",
    });
  }

  // In-memory repository impls for contracts with no declared impl (deterministic demo data).
  for (const repo of feature.repositories ?? []) {
    const declared = (feature.repositoryImpls ?? []).some((ri) => ri.contract === repo.name);
    if (declared) continue;
    const dir = path.join(featureRoot, "data", "repositories");
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, fileName(`${repo.name}InMemoryImpl`));
    fs.writeFileSync(f, generateInMemoryRepository(repo, ctx));
    files.push(f);
    planEntries.push({
      artifact: `${artifactPrefix}repository_impl:${repo.name}InMemoryImpl`,
      generator: "RepositoryImplGenerator",
      schema: "repository_impl",
      layer: "data/repositories",
      file: path.relative(outDir, f),
      strategy: "default",
      dependsOn: [`${artifactPrefix}repository:${repo.name}`],
      mode: "deterministic",
      class: "structural",
    });
  }

  const crudExtras = writeCrudExtras(feature, ctx, arch, featureRoot, outDir);
  files.push(...crudExtras.files);
  planEntries.push(...crudExtras.planEntries.map((e) => ({
    ...e,
    artifact: `${artifactPrefix}${e.artifact}`,
    dependsOn: e.dependsOn.map((d) => `${artifactPrefix}${d}`),
  })));

  // L2: one evaluate<Entity>Policy() file per entity that has >=1 severity'd rule (never IR-
  // declared directly — derived from businessRules, the same shape writeCrudExtras above uses for
  // "which entities get a CRUD form").
  const policyDir = path.join(featureRoot, "domain", "policy");
  for (const entityName of policyEntities(feature)) {
    const entity = feature.entities.find((e) => e.name === entityName);
    if (!entity) continue;
    const rules = policyRulesForEntity(feature, entityName);
    fs.mkdirSync(policyDir, { recursive: true });
    const f = path.join(policyDir, fileName(entityName).replace(/\.dart$/, "_policy.dart"));
    fs.writeFileSync(f, generateEntityPolicy(entity, rules, ctx));
    files.push(f);
    planEntries.push({
      artifact: `${artifactPrefix}policy:${entityName}`,
      generator: "PolicyEngineGenerator",
      schema: "policy",
      layer: "domain/policy",
      file: path.relative(outDir, f),
      strategy: "default",
      dependsOn: [`${artifactPrefix}entity:${entityName}`, ...rules.map((r) => `${artifactPrefix}rule:${r.name}`)],
      mode: "semantic",
      class: "semantic",
    });
  }

  return { files, planEntries };
}

// P2 (contract §4: "keyed by screen path"): re-keys composition.ts's searchTargets() map (by
// screen NAME, the convenient lookup for screen.ts/ctx.search) into the plan.json persisted shape
// (by screenPath(), the human-readable/route-stable key the brief specifies) — a pure formatting
// step, not a second decision; the SearchSpec values themselves are untouched.
function searchByPath(ir: FeatureModel, search: Map<string, SearchSpec>): Record<string, SearchSpec> {
  const screens = ir.screens ?? [];
  const out: Record<string, SearchSpec> = {};
  for (const [screenName, spec] of search) {
    const screen = screens.find((s) => s.name === screenName);
    if (screen) out[screenPath(screens, screen)] = spec;
  }
  return out;
}

// P3 (contract §5): the scroll-analogue of searchByPath above — same pure re-keying of
// scrollTargets() (by screen NAME, screen.ts's lookup) into plan.json's patterns.scroll (by
// screenPath(), the persisted/route-stable key), never a second decision.
function scrollByPath(ir: FeatureModel, scroll: Map<string, ScrollSpec>): Record<string, ScrollSpec> {
  const screens = ir.screens ?? [];
  const out: Record<string, ScrollSpec> = {};
  for (const [screenName, spec] of scroll) {
    const screen = screens.find((s) => s.name === screenName);
    if (screen) out[screenPath(screens, screen)] = spec;
  }
  return out;
}

// P4 (contract §6): the actions-analogue of searchByPath/scrollByPath above — same pure re-keying
// of actionsTargets() (by screen NAME) into plan.json's patterns.actions (by screenPath()).
function actionsByPath(ir: FeatureModel, actions: Map<string, ActionSpec[]>): Record<string, ActionSpec[]> {
  const screens = ir.screens ?? [];
  const out: Record<string, ActionSpec[]> = {};
  for (const [screenName, specs] of actions) {
    const screen = screens.find((s) => s.name === screenName);
    if (screen) out[screenPath(screens, screen)] = specs;
  }
  return out;
}

// P5/D2 Slice 2: the states-analogue of searchByPath/scrollByPath/actionsByPath above — same pure
// re-keying of statePlacementTargets() (by screen NAME) into plan.json's patterns.states (by
// screenPath()).
function statesByPath(ir: FeatureModel, states: Map<string, StatePlacementSpec>): Record<string, StatePlacementSpec> {
  const screens = ir.screens ?? [];
  const out: Record<string, StatePlacementSpec> = {};
  for (const [screenName, spec] of states) {
    const screen = screens.find((s) => s.name === screenName);
    if (screen) out[screenPath(screens, screen)] = spec;
  }
  return out;
}

// S1 (SPIKE_S1_REPORT.md §14.3): the visual-analogue of searchByPath/scrollByPath/actionsByPath/
// statesByPath above — same pure re-keying of visualTargets() (by screen NAME) into plan.json's
// patterns.visual (by screenPath()).
function visualByPath(ir: FeatureModel, visual: Map<string, VisualSpec>): Record<string, VisualSpec> {
  const screens = ir.screens ?? [];
  const out: Record<string, VisualSpec> = {};
  for (const [screenName, spec] of visual) {
    const screen = screens.find((s) => s.name === screenName);
    if (screen) out[screenPath(screens, screen)] = spec;
  }
  return out;
}

// Validate + serialize the Generation Plan (§6.1) and the region-detection manifest.
function writePlan(irVersion: string, planEntries: PlanEntry[], arch: ArchitectureDecision, outDir: string, regionManifestPath: string, nextHashes: Record<string, string>, shell?: ShellPattern | null, search?: Record<string, SearchSpec>, scroll?: Record<string, ScrollSpec>, actions?: Record<string, ActionSpec[]>, states?: Record<string, StatePlacementSpec>, visual?: Record<string, VisualSpec>): void {
  const hasSearch = !!search && Object.keys(search).length > 0;
  const hasScroll = !!scroll && Object.keys(scroll).length > 0;
  const hasActions = !!actions && Object.keys(actions).length > 0;
  const hasStates = !!states && Object.keys(states).length > 0;
  const hasVisual = !!visual && Object.keys(visual).length > 0;
  const plan: GenerationPlan = {
    schemaVersion: irVersion,
    generatorVersion: "1.0.0",
    artifactCount: planEntries.length,
    entries: planEntries,
    scoring: { stateManagement: arch.stateManagement, di: arch.di, routing: arch.routing, persistence: arch.persistence, coupledPair: arch.coupledPair, complexity: arch.complexity },
    // P1/P2/P3/P4/D2/S1 (contract §2.2/§2.6): record the composition layer's shell/search/scroll/
    // actions/states/visual decisions as data. Omitted entirely (not `{ shell: undefined }`/`null`)
    // when none apply — an app with no shell, no searchable list, no list/detail screen, no
    // capability-driven action, no applicable state-placement member, and no screen visualStyle
    // stays byte-identical plan.json to pre-P1/P2/P3/P4/D2/S1 output.
    ...(shell || hasSearch || hasScroll || hasActions || hasStates || hasVisual ? { patterns: { ...(shell ? { shell: { destinations: shell.branches.map(({ feature, ...destination }) => destination) } } : {}), ...(hasSearch ? { search } : {}), ...(hasScroll ? { scroll } : {}), ...(hasActions ? { actions } : {}), ...(hasStates ? { states } : {}), ...(hasVisual ? { visual } : {}) } } : {}),
  };
  const planIssues = validatePlanReferences(plan);
  if (planIssues.length) throw new Error(planIssues.join("\n"));
  fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(plan, null, 2));
  fs.writeFileSync(regionManifestPath, JSON.stringify(nextHashes, null, 2));
}

/**
 * Core generation — the only function that writes files. CLI + web server share this.
 * Pure upstream (generators are (IR, ctx) → string); I/O is confined here.
 * MF1: dispatches to the multi-feature path when the IR is app-level (`"features" in ir`,
 * additive detection — a single-feature `FeatureModel` never has that key); otherwise runs the
 * existing single-feature path, untouched in shape (same steps, same order).
 */
export function generateApp(ir: FeatureModel | AppModel, outDir: string, irVersion = "1", oracleDir?: string): GenerateResult {
  // S1 (§3.1, §2.4): resolve the generation target ONCE at the composition root — every entry
  // point (CLI main(), server.ts, pipeline.ts, and validate.ts's own determinism regen) funnels
  // through generateApp, so dispatching here covers all of them without duplicating the check.
  // `flutter` (absent or explicit) is byte-identical to pre-S1 output: the registry below is
  // untouched, unrebound, and unrenamed.
  const target = targetOf(ir);
  console.log(`[target] ${target}`);
  if (target === "swiftui") {
    // S2: emit the SwiftUI skeleton under <outDir>/ios/ — additive, never touches the Flutter
    // lib/ path below (§5.2's invariant: existing Flutter output stays exactly where it is).
    return writeSwiftUITarget(ir, outDir);
  }

  if (Array.isArray((ir as AppModel).features)) {
    return generateMultiFeatureApp(ir as AppModel, outDir, irVersion, oracleDir);
  }
  return generateSingleFeatureApp(ir as FeatureModel, outDir, irVersion, oracleDir);
}

/**
 * S2: writes the swiftui target's emitted files under <outDir>/ios/ — the ONLY I/O this target
 * performs (generateSwiftUITarget itself is a pure (IR, ctx) -> files list, brief §2.1/§2.2).
 * Mirrors the Flutter path's own "clean stale output, then write" convention
 * (generateSingleFeatureApp's fs.rmSync before writing lib/ below) so a repeated run never leaks a
 * file a later IR no longer emits — the same determinism posture, applied to ios/ instead of lib/.
 * `scoring`/`conflicts` are minimal/empty for S2: there is no per-state architecture scoring or
 * region-preservation machinery for Swift yet (both are Flutter-specific, built for later slices).
 */
function writeSwiftUITarget(ir: any, outDir: string): GenerateResult {
  const iosDir = path.join(outDir, "ios");
  fs.rmSync(iosDir, { recursive: true, force: true });
  const project = generateSwiftUITarget(ir, { ir });
  for (const file of project.files) {
    const dest = path.join(iosDir, file.path);
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, file.content);
  }
  return { outDir, fileCount: project.files.length, scoring: [`target → swiftui`], conflicts: [] };
}

function generateSingleFeatureApp(ir: FeatureModel, outDir: string, irVersion = "1", oracleDir?: string): GenerateResult {
  // Write-ACL (DESIGN §9.3): human-only fields require an attested human actor.
  const aclViolations = enforceWriteAcl(ir);
  if (aclViolations.length) throw new Error(aclViolations.join("\n"));

  // Approval gate (DESIGN §9.2): LLM-inferred elements require human attestation before generation.
  const unapproved = unapprovedElements(ir);
  if (unapproved.length) {
    throw new Error(
      `[approval] ${unapproved.length} element(s) require human approval before generation:\n` +
        unapproved.map((u) => `  - ${u}`).join("\n") +
        `\nRun builder/src/approve.ts to attest them (actor=human:attested).`,
    );
  }

  const pkg = pkgName(ir.name);
  const symbols = buildSymbols(ir);
  const arch = decideArchitecture(ir);
  // P2 (contract §4): decide per-list search ONCE, here — composition.ts's searchTargets is the
  // only owner of this decision (contract §1); screen.ts only ever consumes ctx.search by name.
  const search = searchTargets(ir);
  // P3 (contract §5): decide per-screen scroll ONCE, here — composition.ts's scrollTargets is the
  // only owner of this decision; screen.ts only ever consumes ctx.scroll by name.
  const scroll = scrollTargets(ir);
  // P4 (contract §6): decide per-screen actions ONCE, here — composition.ts's actionsTargets is
  // the only owner of this decision; screen.ts only ever consumes ctx.actions by name.
  const actions = actionsTargets(ir);
  // P5/D2 Slice 2: decide per-screen state placement (loading/error) ONCE, here — composition.ts's
  // statePlacementTargets is the only owner of this decision; screen.ts only ever consumes
  // ctx.states by name.
  const states = statePlacementTargets(ir);
  // S1 (SPIKE_S1_REPORT.md §14.3): decide per-screen visual intent ONCE, here — composition.ts's
  // visualTargets is the only owner of this decision; screen.ts only ever consumes ctx.visual by
  // name, applying the decided deltas verbatim (never re-deriving from the raw enum values).
  const visual = visualTargets(ir);
  const ctx: GenContext = { pkg, symbols, ir, sm: arch.stateManagement, search, scroll, actions, states, visual };

  const scoring: string[] = [];
  for (const s of ir.states ?? []) scoring.push(`${s.name} → ${arch.perStateStrategy.get(s.name) ?? "enum-status"}`);
  scoring.push(`app → ${arch.stateManagement} (${arch.coupledPair})`);
  scoring.push(`persistence → ${arch.persistence}`);

  const planEntries: PlanEntry[] = [];

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validators: Record<string, any> = {};
  for (const entry of registry) validators[entry.schema] = ajv.compile(loadSchema(entry.schema));
  const check = (label: string, v: any, value: any) => {
    if (!v(value)) throw new Error(`[validator] ${label}: INVALID\n${ajv.errorsText(v.errors)}`);
  };

  const featureRoot = path.join(outDir, "lib", "features", ir.name);
  const coreDir = path.join(outDir, "lib", "core");

  // Region detection (§11.1): snapshot scaffold (use-case) files + last-known hashes BEFORE cleaning,
  // so drifted user regions are preserved rather than silently clobbered.
  const regionManifestPath = path.join(outDir, "regions.json");
  const lastKnownHashes: Record<string, string> = fs.existsSync(regionManifestPath)
    ? JSON.parse(fs.readFileSync(regionManifestPath, "utf8"))
    : {};
  const useCaseDir = path.join(featureRoot, "domain", "usecases");
  const existingUseCases = new Map<string, string>();
  if (fs.existsSync(useCaseDir)) {
    for (const e of fs.readdirSync(useCaseDir)) {
      if (e.endsWith(".dart")) existingUseCases.set(e, fs.readFileSync(path.join(useCaseDir, e), "utf8"));
    }
  }
  const conflicts: RegionConflict[] = [];
  const nextHashes: Record<string, string> = {};

  fs.rmSync(path.join(outDir, "lib"), { recursive: true, force: true }); // clean stale output
  fs.mkdirSync(coreDir, { recursive: true });

  bundleFonts(outDir);

  const featureResult = writeFeatureArtifacts(ir, ctx, arch, featureRoot, outDir, ajv, validators, check, existingUseCases, lastKnownHashes, conflicts, nextHashes, "");
  const files: string[] = [...featureResult.files];
  planEntries.push(...featureResult.planEntries);

  const coreResult = writeCore(ir, ctx, arch, coreDir, outDir);
  files.push(...coreResult.files);
  planEntries.push(...coreResult.planEntries);

  const barrelFile = path.join(outDir, "lib", "generated.dart");
  fs.writeFileSync(barrelFile, generateBarrel(ir, ctx));
  const mainFile = path.join(outDir, "lib", "main.dart");
  fs.writeFileSync(mainFile, generateMain(ir, arch.stateManagement));
  fs.writeFileSync(path.join(outDir, "pubspec.yaml"), generatePubspec(ir, arch));
  fs.writeFileSync(path.join(outDir, "builder.lock.json"), JSON.stringify(buildLockfile(irVersion, outDir), null, 2));
  files.push(...writeWebScaffold(outDir, pkg));
  const testDir = path.join(outDir, "test");
  const testsResult = writeTests(ir, arch, outDir, testDir, oracleDir, pkg, ir, ctx);
  files.push(...testsResult.files);
  planEntries.push(...testsResult.planEntries);
  planEntries.push(
    { artifact: "core:barrel", generator: "BarrelGenerator", schema: "core", layer: "core", file: path.relative(outDir, barrelFile), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural" },
    { artifact: "core:main", generator: "MainGenerator", schema: "core", layer: "core", file: path.relative(outDir, mainFile), strategy: "default", dependsOn: ["core:barrel"], mode: "deterministic", class: "structural" },
  );

  writePlan(irVersion, planEntries, arch, outDir, regionManifestPath, nextHashes, undefined, searchByPath(ir, search), scrollByPath(ir, scroll), actionsByPath(ir, actions), statesByPath(ir, states), visualByPath(ir, visual));

  return { outDir, fileCount: files.length + 9, scoring, conflicts };
}

// MF1: app-level IR spanning multiple features. Reuses every existing generator unchanged — the
// only new logic here is (a) merging each feature's symbol table into one app-wide table so
// cross-feature imports resolve to the right `features/<name>/...` path, (b) building ONE merged
// pseudo-FeatureModel (concatenated arrays) so the core generators that already read a whole
// FeatureModel (di.ts, route.ts, project.ts's barrel/pubspec) see every feature's content without
// any changes to those generators, and (c) calling writeFeatureArtifacts once per feature so each
// one's own domain/data/presentation lands under its own features/<name>/ folder.
function generateMultiFeatureApp(app: AppModel, outDir: string, irVersion = "1", oracleDir?: string): GenerateResult {
  if (!app.features.length) throw new Error("[pipeline] multi-feature IR declares zero features");

  for (const f of app.features) {
    const aclViolations = enforceWriteAcl(f);
    if (aclViolations.length) throw new Error(aclViolations.join("\n"));
    const unapproved = unapprovedElements(f);
    if (unapproved.length) {
      throw new Error(
        `[approval] feature '${f.name}': ${unapproved.length} element(s) require human approval before generation:\n` +
          unapproved.map((u) => `  - ${u}`).join("\n") +
          `\nRun builder/src/approve.ts to attest them (actor=human:attested).`,
      );
    }
  }

  const pkg = pkgName(app.name);
  const symbols = new Map<string, string>();
  for (const f of app.features) for (const [k, v] of buildSymbols(f)) symbols.set(k, v);

  // One merged pseudo-FeatureModel — concatenated arrays, app-level attributes/name — so every
  // generator that reads a whole FeatureModel (di.ts, route.ts, barrel/pubspec/tests) produces
  // ONE shared di.dart/router.dart/generated.dart/pubspec.yaml covering all features, with zero
  // changes to those generators themselves.
  const merged: FeatureModel = {
    name: app.name,
    attributes: app.attributes,
    entities: app.features.flatMap((f) => f.entities),
    enums: app.features.flatMap((f) => f.enums ?? []),
    valueObjects: app.features.flatMap((f) => f.valueObjects ?? []),
    repositories: app.features.flatMap((f) => f.repositories ?? []),
    models: app.features.flatMap((f) => f.models ?? []),
    states: app.features.flatMap((f) => f.states ?? []),
    queries: app.features.flatMap((f) => f.queries ?? []),
    wrappers: app.features.flatMap((f) => f.wrappers ?? []),
    useCases: app.features.flatMap((f) => f.useCases ?? []),
    datasources: app.features.flatMap((f) => f.datasources ?? []),
    repositoryImpls: app.features.flatMap((f) => f.repositoryImpls ?? []),
    screens: app.features.flatMap((f) => f.screens ?? []),
    stateMachines: app.features.flatMap((f) => f.stateMachines ?? []),
    forms: app.features.flatMap((f) => f.forms ?? []),
    businessRules: app.features.flatMap((f) => f.businessRules ?? []),
  };

  // MF2: per-feature buildSymbols (above) never sees app-level attributes.auth — the auth symbols
  // (Session/Persona/AuthLoginScreen) exist for the whole app, so map them onto the merged table.
  addAuthSymbols(symbols, merged);
  // MF5: same reasoning as MF2 above — attributes.budget lives at the app level too, so no single
  // feature's own buildSymbols(f) call ever sees it (resolveBudget(f) fails per-feature even when
  // the budget entity itself lives inside one of the features), leaving BudgetLine unregistered
  // and every cross-reference (barrel export, screen import, test import) falling back to a wrong
  // guessed path. Map it onto the merged table once resolution succeeds against the flattened IR.
  if (resolveBudget(merged)) {
    symbols.set("BudgetLine", "core/budget.dart");
  }
  // MF6: same reasoning as MF5's BudgetLine fix above — attributes.outbox is app-level, invisible
  // to any single feature's own buildSymbols(f) call, so every outbox-enabled repo impl's import
  // of Outbox would otherwise resolve to a wrong guessed path.
  if (hasOutbox(merged)) {
    symbols.set("Outbox", "core/outbox.dart");
  }
  // MF3: same reasoning as MF5/MF6 above — attributes.attachments is app-level, invisible to any
  // single feature's own buildSymbols(f) call. Latent since MF3 landed (no multi-feature sample
  // ever declared attributes.attachments until ledgerly.ir.json's Ledgerly-MVP completion) —
  // caught by `flutter analyze` on the generated barrel (`export 'receiptattachment.dart';`, a
  // guessed path that doesn't exist, instead of the real core/attachment.dart export).
  if (hasAttachments(merged)) {
    symbols.set("ReceiptAttachment", "core/attachment.dart");
    symbols.set("OcrResult", "core/attachment.dart");
    symbols.set("ReceiptOcrPort", "core/attachment.dart");
    symbols.set("MockReceiptOcr", "core/attachment.dart");
    symbols.set("synthesizeAttachment", "core/attachment.dart");
    symbols.set("kLowOcrConfidence", "core/attachment.dart");
  }

  const arch = decideArchitecture(merged);
  // P2 (contract §4): same single decision point as the single-feature path above, over the
  // merged screens/entities/repositories (searchTargets needs no per-feature grouping).
  const search = searchTargets(merged);
  // P3 (contract §5): same single decision point, over the merged screens (scrollTargets reads
  // only screen types — no per-feature grouping needed).
  const scroll = scrollTargets(merged);
  // P4 (contract §6): same single decision point, over the merged screens/entities/repositories.
  const actions = actionsTargets(merged);
  // P5/D2 Slice 2: same single decision point, over the merged screens/entities/repositories.
  const states = statePlacementTargets(merged);
  // S1 (SPIKE_S1_REPORT.md §14.3): same single decision point, over the merged screens.
  const visual = visualTargets(merged);
  const ctx: GenContext = { pkg, symbols, ir: merged, sm: arch.stateManagement, search, scroll, actions, states, visual };

  // P1 (INTERFACE_PATTERN_CONTRACT.md §3): decide the global-shell pattern ONCE, here — the only
  // owner of this decision (contract §1 master principle). `null` for a single-feature AppModel;
  // throws a plain generation error for >5 features (contract §3.2 — a target-capability limit,
  // not an IR/schema failure) BEFORE any output is cleaned/written below, so a rejected IR never
  // clobbers a previously-valid outDir. writeCore (→ route.ts/app_shell.ts) and writePlan only
  // ever consume this decided payload, never re-derive it.
  const shell = shellFor(app.features, merged.screens ?? []);

  const scoring: string[] = [];
  for (const s of merged.states ?? []) scoring.push(`${s.name} → ${arch.perStateStrategy.get(s.name) ?? "enum-status"}`);
  scoring.push(`app → ${arch.stateManagement} (${arch.coupledPair})`);
  scoring.push(`persistence → ${arch.persistence}`);

  const planEntries: PlanEntry[] = [];

  const ajv = new Ajv({ allErrors: true, strict: false });
  const validators: Record<string, any> = {};
  for (const entry of registry) validators[entry.schema] = ajv.compile(loadSchema(entry.schema));
  const check = (label: string, v: any, value: any) => {
    if (!v(value)) throw new Error(`[validator] ${label}: INVALID\n${ajv.errorsText(v.errors)}`);
  };

  const coreDir = path.join(outDir, "lib", "core");

  // Region detection (§11.1), app-wide: scan every feature's use-case dir BEFORE cleaning, so a
  // drifted user region in ANY feature survives regeneration (same mechanism as single-feature,
  // just looped — keyed by filename, matching the existing single-feature scoping).
  const regionManifestPath = path.join(outDir, "regions.json");
  const lastKnownHashes: Record<string, string> = fs.existsSync(regionManifestPath)
    ? JSON.parse(fs.readFileSync(regionManifestPath, "utf8"))
    : {};
  const existingUseCases = new Map<string, string>();
  for (const f of app.features) {
    const useCaseDir = path.join(outDir, "lib", "features", f.name, "domain", "usecases");
    if (fs.existsSync(useCaseDir)) {
      for (const e of fs.readdirSync(useCaseDir)) {
        if (e.endsWith(".dart")) existingUseCases.set(e, fs.readFileSync(path.join(useCaseDir, e), "utf8"));
      }
    }
  }
  const conflicts: RegionConflict[] = [];
  const nextHashes: Record<string, string> = {};

  fs.rmSync(path.join(outDir, "lib"), { recursive: true, force: true }); // clean stale output
  fs.mkdirSync(coreDir, { recursive: true });

  bundleFonts(outDir);

  const files: string[] = [];
  for (const f of app.features) {
    const featureRoot = path.join(outDir, "lib", "features", f.name);
    const result = writeFeatureArtifacts(f, ctx, arch, featureRoot, outDir, ajv, validators, check, existingUseCases, lastKnownHashes, conflicts, nextHashes, `feature:${f.name}:`);
    files.push(...result.files);
    planEntries.push(...result.planEntries);
  }

  // lib/core/ once, shared across all features — di.ts/route.ts see the merged repos/usecases/
  // states/screens, the rest (theme/components/localization/...) ignore feature content entirely.
  const coreResult = writeCore(merged, ctx, arch, coreDir, outDir, shell);
  files.push(...coreResult.files);
  planEntries.push(...coreResult.planEntries);

  const barrelFile = path.join(outDir, "lib", "generated.dart");
  fs.writeFileSync(barrelFile, generateBarrel(merged, ctx));
  const mainFile = path.join(outDir, "lib", "main.dart");
  fs.writeFileSync(mainFile, generateMultiMain(app.features, arch.stateManagement, app.attributes?.locale, app.attributes?.themeMode));
  fs.writeFileSync(path.join(outDir, "pubspec.yaml"), generatePubspec(merged, arch));
  fs.writeFileSync(path.join(outDir, "builder.lock.json"), JSON.stringify(buildLockfile(irVersion, outDir), null, 2));
  files.push(...writeWebScaffold(outDir, pkg));
  const testDir = path.join(outDir, "test");
  // flow/crud-flow tests are scoped to the first feature only (same "feature[0] is the app's
  // testable identity" convention initialLocation/generateMain/generateGoldenTest already use) —
  // `name` overridden to the app's own pkg name since generateFlowTest/generateCrudFlowTest derive
  // their `package:...` imports from `feature.name` internally. Attributes overridden to the
  // app-level ones (MF2): auth is declared on app.attributes, but hasAuth()/isTargetReachable()
  // read feature.attributes — the boot tests must sign in as the first persona, so the flow/crud
  // scope must see app-level auth that feature[0] itself doesn't carry. For non-auth apps
  // app.attributes carries no `auth` either way, so hasAuth()==false and output is unchanged.
  const flowTestScope: FeatureModel = { ...app.features[0]!, name: app.name, attributes: app.attributes };
  // Latent MF1 bug, surfaced by the first multi-feature sample to combine businessRules+oracle
  // (ledgerly.ir.json's L2 policy rules): writeFeatureArtifacts above tags every per-feature
  // artifact `feature:<name>:rule:<ruleName>` (the same `artifactPrefix` also prefixes that
  // artifact's own dependsOn, so entity/state/screen cross-references inside one feature already
  // resolve correctly) — but writeTests's oracle-test entry is built from `merged` (no feature
  // scope) and always assumed a bare `rule:<ruleName>` tag, which only happens to be correct for a
  // single-feature IR. Resolve the rule's REAL tag from the already-accumulated per-feature
  // planEntries instead of assuming the bare form; falls back to the bare tag when not found
  // (single-feature callers below never hit this — they use writeTests's default resolver).
  const ruleArtifactTag = (name: string): string =>
    planEntries.find((e) => e.artifact === `rule:${name}` || e.artifact.endsWith(`:rule:${name}`))?.artifact ?? `rule:${name}`;
  const testsResult = writeTests(merged, arch, outDir, testDir, oracleDir, pkg, flowTestScope, ctx, ruleArtifactTag);
  files.push(...testsResult.files);
  planEntries.push(...testsResult.planEntries);
  planEntries.push(
    { artifact: "core:barrel", generator: "BarrelGenerator", schema: "core", layer: "core", file: path.relative(outDir, barrelFile), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural" },
    { artifact: "core:main", generator: "MainGenerator", schema: "core", layer: "core", file: path.relative(outDir, mainFile), strategy: "default", dependsOn: ["core:barrel"], mode: "deterministic", class: "structural" },
  );

  writePlan(irVersion, planEntries, arch, outDir, regionManifestPath, nextHashes, shell, searchByPath(merged, search), scrollByPath(merged, scroll), actionsByPath(merged, actions), statesByPath(merged, states), visualByPath(merged, visual));

  return { outDir, fileCount: files.length + 9, scoring, conflicts };
}

function main() {
  const args = process.argv.slice(2);
  const irPath = args[0] ?? path.join(__dirname, "..", "samples", "expense.semantic.ir.json");
  const outDir = args[1] ?? path.join(__dirname, "..", "output", "generated_app");

  let raw: any;
  try {
    raw = JSON.parse(fs.readFileSync(irPath, "utf8"));
  } catch (e) {
    throw new Error(`[pipeline] failed to read/parse IR at ${irPath}: ${(e as Error).message}`);
  }
  if (typeof raw.schemaVersion !== "string") {
    throw new Error(`[pipeline] IR missing schemaVersion (DESIGN §2.1) at ${irPath}`);
  }

  const result = generateApp(raw as FeatureModel | AppModel, outDir, raw.schemaVersion, oracleDirFor(irPath));
  console.log(`[context] generator=1.0.0 irVersion=${raw.schemaVersion}`);
  result.scoring.forEach((s) => console.log(`[scoring] ${s}`));
  console.log(`Generated ${result.fileCount} file(s) → ${outDir}`);
  if (result.conflicts.length) {
    console.log(`[regions] ${result.conflicts.length} conflict(s) preserved (no silent overwrite):`);
    result.conflicts.forEach((c) => console.log(`  - ${c.file}: ${c.reason}`));
  }
}

if (require.main === module) main();
