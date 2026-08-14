import * as fs from "fs";
import * as path from "path";
import Ajv from "ajv";
import { FeatureModel } from "./types";
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
import { generateRepositoryImpl } from "./generators/repository_impl";
import { generateScreen } from "./generators/screen";
import { generateStateMachine } from "./generators/state_machine";
import { generateForm } from "./generators/form";
import { generateRule } from "./generators/rule";
import { generateDi } from "./generators/di";
import { generateRoutes } from "./generators/route";
import { generateUnitTest, generateGoldenTest, generateFlowTest } from "./generators/test";
import { generateLocalization, generateTheme, generateConfig, generateSecrets, generateObservability, generateValidator } from "./generators/infra";
import { generateComponents } from "./generators/components";
import { generatePubspec, generateMain, generateBarrel, generateWidgetTest } from "./generators/project";
import { scoreStateStrategy } from "./scoring";
import { decideArchitecture } from "./arch";
import { PlanEntry, GenerationPlan, dependsOnFor, tagForIrKey, validatePlanReferences, GenClass } from "./plan";
import { RegionConflict, checkOverwrite, userRegionHash } from "./region";
import { buildLockfile } from "./context";
import { unapprovedElements } from "./provenance";
import { loadOracle, oracleDirFor } from "./oracle";
import { generateOracleTest } from "./generators/oracle_test";

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

/**
 * Core generation — the only function that writes files. CLI + web server share this.
 * Pure upstream (generators are (IR, ctx) → string); I/O is confined here.
 */
export function generateApp(ir: FeatureModel, outDir: string, irVersion = "1", oracleDir?: string): GenerateResult {
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

  const planEntries: PlanEntry[] = [];

  const ajv = new Ajv({ allErrors: true, strict: false });
  const loadSchema = (n: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "schemas", `${n}.schema.json`), "utf8"));
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
  const files: string[] = [];

  for (const entry of registry) {
    const tag = tagForIrKey(entry.irKey);
    const items = (ir as any)[entry.irKey] ?? [];
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
        artifact: `${tag}:${item.name}`,
        generator: entry.generator,
        schema: entry.schema,
        layer: entry.layer,
        file: path.relative(outDir, f),
        strategy: tag === "state" ? arch.perStateStrategy.get(item.name) ?? "enum-status" : "default",
        dependsOn: dependsOnFor(entry.irKey, item),
        mode: entry.class === "semantic" ? "semantic" : "deterministic",
        class: entry.class,
      });
    }
  }

  for (const entity of ir.entities) {
    const override = (ir.models ?? []).find((m) => m.entity === entity.name);
    if (override) check(`model:${entity.name}`, ajv.compile(loadSchema("model")), override);
    const dir = path.join(featureRoot, "data/models");
    fs.mkdirSync(dir, { recursive: true });
    const f = path.join(dir, fileName(entity.name).replace(/\.dart$/, "_model.dart"));
    fs.writeFileSync(f, generateModel(entity, override, ctx));
    files.push(f);
    planEntries.push({
      artifact: `model:${entity.name}`,
      generator: "ModelGenerator",
      schema: "model",
      layer: "data/models",
      file: path.relative(outDir, f),
      strategy: "default",
      dependsOn: [`entity:${entity.name}`],
      mode: "deterministic",
      class: "structural",
    });
  }

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
  };
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

  const barrelFile = path.join(outDir, "lib", "generated.dart");
  fs.writeFileSync(barrelFile, generateBarrel(ir, ctx));
  const mainFile = path.join(outDir, "lib", "main.dart");
  fs.writeFileSync(mainFile, generateMain(ir, arch.stateManagement));
  fs.writeFileSync(path.join(outDir, "pubspec.yaml"), generatePubspec(ir, arch));
  fs.writeFileSync(path.join(outDir, "builder.lock.json"), JSON.stringify(buildLockfile(irVersion), null, 2));
  const testDir = path.join(outDir, "test");
  fs.mkdirSync(testDir, { recursive: true });
  const testFiles: [string, string, string][] = [
    ["widget_test.dart", generateWidgetTest(ir), "WidgetTestGenerator"],
    ["unit_test.dart", generateUnitTest(ir), "UnitTestGenerator"],
    ["flow_test.dart", generateFlowTest(ir), "FlowTestGenerator"],
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
  planEntries.push(
    { artifact: "core:barrel", generator: "BarrelGenerator", schema: "core", layer: "core", file: path.relative(outDir, barrelFile), strategy: "default", dependsOn: [], mode: "deterministic", class: "structural" },
    { artifact: "core:main", generator: "MainGenerator", schema: "core", layer: "core", file: path.relative(outDir, mainFile), strategy: "default", dependsOn: ["core:barrel"], mode: "deterministic", class: "structural" },
  );

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

  const plan: GenerationPlan = {
    schemaVersion: irVersion,
    generatorVersion: "1.0.0",
    artifactCount: planEntries.length,
    entries: planEntries,
    scoring: { stateManagement: arch.stateManagement, di: arch.di, routing: arch.routing, coupledPair: arch.coupledPair, complexity: arch.complexity },
  };
  const planIssues = validatePlanReferences(plan);
  if (planIssues.length) throw new Error(planIssues.join("\n"));
  fs.writeFileSync(path.join(outDir, "plan.json"), JSON.stringify(plan, null, 2));
  fs.writeFileSync(regionManifestPath, JSON.stringify(nextHashes, null, 2));

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

  const result = generateApp(raw as FeatureModel, outDir, raw.schemaVersion, oracleDirFor(irPath));
  console.log(`[context] generator=1.0.0 irVersion=${raw.schemaVersion}`);
  result.scoring.forEach((s) => console.log(`[scoring] ${s}`));
  console.log(`Generated ${result.fileCount} file(s) → ${outDir}`);
  if (result.conflicts.length) {
    console.log(`[regions] ${result.conflicts.length} conflict(s) preserved (no silent overwrite):`);
    result.conflicts.forEach((c) => console.log(`  - ${c.file}: ${c.reason}`));
  }
}

if (require.main === module) main();
