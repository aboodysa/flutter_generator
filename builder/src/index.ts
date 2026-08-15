import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import { FeatureModel, AppModel } from "./types";
import { fileName, GenContext } from "./dart";
import { pkgName, buildSymbols } from "./symbols";
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
import { generateUnitTest, generateGoldenTest, generateFlowTest, generateCrudFlowTest } from "./generators/test";
import { generateLocalization, generateTheme, generateConfig, generateSecrets, generateObservability, generateValidator, generateNoParams, generateMoney } from "./generators/infra";
import { generateComponents } from "./generators/components";
import { generatePubspec, generateMain, generateMultiMain, generateBarrel, generateWidgetTest } from "./generators/project";
import { scoreStateStrategy } from "./scoring";
import { decideArchitecture, ArchitectureDecision } from "./arch";
import { PlanEntry, GenerationPlan, dependsOnFor, tagForIrKey, validatePlanReferences, GenClass } from "./plan";
import { RegionConflict, checkOverwrite, userRegionHash } from "./region";
import { buildLockfile } from "./context";
import { unapprovedElements } from "./provenance";
import { loadOracle, oracleDirFor } from "./oracle";
import { generateOracleTest } from "./generators/oracle_test";
import { generateCrudFormScreen } from "./generators/crud_form";
import { generateDriftTable, generateHiveAdapter } from "./generators/persistence";
import { crudFormTargets, crudFormScreenName, listEntityName, hasMoneyFields } from "./operations";

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
function writeCore(ir: FeatureModel, ctx: GenContext, arch: ArchitectureDecision, coreDir: string, outDir: string): { files: string[]; planEntries: PlanEntry[] } {
  const core: [string, string][] = [
    ["di.dart", generateDi(ir, ctx, arch)],
    ["router.dart", generateRoutes(ir, ctx, arch)],
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
// "+9" fileCount constant instead (preserved as-is from before this split).
// MF1: `flowTestScope` (defaults to `ir` — single-feature callers pass nothing, unchanged
// behavior) scopes generateFlowTest/generateCrudFlowTest separately from the rest. Those two scan
// the WHOLE screens/repository array for "a detail screen"/"a CRUD target" and assume it's
// reachable from the app's home screen — true for one feature, false for a merged multi-feature
// model where the home screen (feature[0]'s) and some OTHER feature's detail/CRUD screen have no
// navigational relationship. generateWidgetTest/generateUnitTest/generateGoldenTest don't have
// this problem (they only ever look at `entities[0]`/`screens[0]`, which for a merged model is
// already feature[0]'s own — no scoping needed there).
function writeTests(ir: FeatureModel, arch: ArchitectureDecision, outDir: string, testDir: string, oracleDir: string | undefined, pkg: string, flowTestScope: FeatureModel = ir): { files: string[]; planEntries: PlanEntry[] } {
  fs.mkdirSync(testDir, { recursive: true });
  const files: string[] = [];
  const planEntries: PlanEntry[] = [];

  const testFiles: [string, string, string][] = [
    ["widget_test.dart", generateWidgetTest(ir), "WidgetTestGenerator"],
    ["unit_test.dart", generateUnitTest(ir), "UnitTestGenerator"],
    ["flow_test.dart", generateFlowTest(flowTestScope), "FlowTestGenerator"],
    ["golden_test.dart", generateGoldenTest(ir, arch.stateManagement), "GoldenTestGenerator"],
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
        dependsOn: [`rule:${rule.name}`],
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

  return { files, planEntries };
}

// Validate + serialize the Generation Plan (§6.1) and the region-detection manifest.
function writePlan(irVersion: string, planEntries: PlanEntry[], arch: ArchitectureDecision, outDir: string, regionManifestPath: string, nextHashes: Record<string, string>): void {
  const plan: GenerationPlan = {
    schemaVersion: irVersion,
    generatorVersion: "1.0.0",
    artifactCount: planEntries.length,
    entries: planEntries,
    scoring: { stateManagement: arch.stateManagement, di: arch.di, routing: arch.routing, persistence: arch.persistence, coupledPair: arch.coupledPair, complexity: arch.complexity },
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
  if (Array.isArray((ir as AppModel).features)) {
    return generateMultiFeatureApp(ir as AppModel, outDir, irVersion, oracleDir);
  }
  return generateSingleFeatureApp(ir as FeatureModel, outDir, irVersion, oracleDir);
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
  const ctx: GenContext = { pkg, symbols, ir, sm: arch.stateManagement };

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
  fs.writeFileSync(path.join(outDir, "builder.lock.json"), JSON.stringify(buildLockfile(irVersion), null, 2));
  const testDir = path.join(outDir, "test");
  const testsResult = writeTests(ir, arch, outDir, testDir, oracleDir, pkg);
  files.push(...testsResult.files);
  planEntries.push(...testsResult.planEntries);
  planEntries.push(
    { artifact: "core:barrel", generator: "BarrelGenerator", schema: "core", layer: "core", file: path.relative(outDir, barrelFile), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural" },
    { artifact: "core:main", generator: "MainGenerator", schema: "core", layer: "core", file: path.relative(outDir, mainFile), strategy: "default", dependsOn: ["core:barrel"], mode: "deterministic", class: "structural" },
  );

  writePlan(irVersion, planEntries, arch, outDir, regionManifestPath, nextHashes);

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

  const arch = decideArchitecture(merged);
  const ctx: GenContext = { pkg, symbols, ir: merged, sm: arch.stateManagement };

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
  const coreResult = writeCore(merged, ctx, arch, coreDir, outDir);
  files.push(...coreResult.files);
  planEntries.push(...coreResult.planEntries);

  const barrelFile = path.join(outDir, "lib", "generated.dart");
  fs.writeFileSync(barrelFile, generateBarrel(merged, ctx));
  const mainFile = path.join(outDir, "lib", "main.dart");
  fs.writeFileSync(mainFile, generateMultiMain(app.features, arch.stateManagement));
  fs.writeFileSync(path.join(outDir, "pubspec.yaml"), generatePubspec(merged, arch));
  fs.writeFileSync(path.join(outDir, "builder.lock.json"), JSON.stringify(buildLockfile(irVersion), null, 2));
  const testDir = path.join(outDir, "test");
  // flow/crud-flow tests are scoped to the first feature only (same "feature[0] is the app's
  // testable identity" convention initialLocation/generateMain/generateGoldenTest already use) —
  // `name` overridden to the app's own pkg name since generateFlowTest/generateCrudFlowTest derive
  // their `package:...` imports from `feature.name` internally.
  const flowTestScope: FeatureModel = { ...app.features[0]!, name: app.name };
  const testsResult = writeTests(merged, arch, outDir, testDir, oracleDir, pkg, flowTestScope);
  files.push(...testsResult.files);
  planEntries.push(...testsResult.planEntries);
  planEntries.push(
    { artifact: "core:barrel", generator: "BarrelGenerator", schema: "core", layer: "core", file: path.relative(outDir, barrelFile), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural" },
    { artifact: "core:main", generator: "MainGenerator", schema: "core", layer: "core", file: path.relative(outDir, mainFile), strategy: "default", dependsOn: ["core:barrel"], mode: "deterministic", class: "structural" },
  );

  writePlan(irVersion, planEntries, arch, outDir, regionManifestPath, nextHashes);

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
