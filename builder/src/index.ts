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

/**
 * Generator registry — the only place that maps artifact type → { schema, generator, layer, file name }.
 * Adding a generator = one entry; the dispatch core is closed for modification (OCP).
 */
interface RegistryEntry {
  irKey: string;
  schema: string;
  layer: string;
  generate: (item: any, ctx?: GenContext) => string;
  file: (item: any) => string;
  label: (item: any) => string;
}

const registry: RegistryEntry[] = [
  { irKey: "enums", schema: "enum", layer: "domain/entities", generate: generateEnum, file: (e) => fileName(e.name), label: (e) => e.name },
  { irKey: "valueObjects", schema: "valueobject", layer: "domain/entities", generate: generateValueObject, file: (v) => fileName(v.name), label: (v) => v.name },
  { irKey: "queries", schema: "query", layer: "domain/entities", generate: generateQuery, file: (q) => fileName(q.name), label: (q) => q.name },
  { irKey: "wrappers", schema: "wrapper", layer: "domain/entities", generate: generateWrapper, file: (w) => fileName(w.name), label: (w) => w.name },
  { irKey: "entities", schema: "entity", layer: "domain/entities", generate: generateEntity, file: (e) => fileName(e.name), label: (e) => e.name },
  { irKey: "repositories", schema: "repository", layer: "domain/repositories", generate: generateRepository, file: (r) => fileName(r.name), label: (r) => r.name },
  { irKey: "useCases", schema: "usecase", layer: "domain/usecases", generate: generateUseCase, file: (u) => fileName(u.name), label: (u) => u.name },
  { irKey: "datasources", schema: "datasource", layer: "data/datasources", generate: generateDatasource, file: (d) => fileName(d.name), label: (d) => d.name },
  { irKey: "repositoryImpls", schema: "repository_impl", layer: "data/repositories", generate: generateRepositoryImpl, file: (r) => fileName(r.name), label: (r) => r.name },
  { irKey: "states", schema: "state", layer: "presentation/state", generate: generateState, file: (s) => fileName(s.name), label: (s) => s.name },
  { irKey: "screens", schema: "screen", layer: "presentation/screens", generate: generateScreen, file: (s) => fileName(s.name), label: (s) => s.name },
  { irKey: "stateMachines", schema: "state_machine", layer: "domain/state_machines", generate: generateStateMachine, file: (s) => fileName(s.name + "StateMachine"), label: (s) => s.name },
  { irKey: "forms", schema: "form", layer: "presentation/forms", generate: generateForm, file: (f) => fileName(f.name), label: (f) => f.name },
  { irKey: "businessRules", schema: "rule", layer: "domain/rules", generate: generateRule, file: (r) => fileName(r.name), label: (r) => r.name },
];

export interface GenerateResult {
  outDir: string;
  fileCount: number;
  scoring: string[];
}

/**
 * Core generation — the only function that writes files. CLI + web server share this.
 * Pure upstream (generators are (IR, ctx) → string); I/O is confined here.
 */
export function generateApp(ir: FeatureModel, outDir: string, irVersion = "1"): GenerateResult {
  // Write-ACL (DESIGN §9.3): human-only fields require an attested human actor.
  const aclViolations = enforceWriteAcl(ir);
  if (aclViolations.length) throw new Error(aclViolations.join("\n"));

  const pkg = pkgName(ir.name);
  const symbols = buildSymbols(ir);
  const ctx: GenContext = { pkg, symbols, ir };

  const scoring: string[] = [];
  for (const s of ir.states ?? []) scoring.push(`${s.name} → ${scoreStateStrategy(s)}`);

  const ajv = new Ajv({ allErrors: true, strict: false });
  const loadSchema = (n: string) => JSON.parse(fs.readFileSync(path.join(__dirname, "..", "schemas", `${n}.schema.json`), "utf8"));
  const validators: Record<string, any> = {};
  for (const entry of registry) validators[entry.schema] = ajv.compile(loadSchema(entry.schema));
  const check = (label: string, v: any, value: any) => {
    if (!v(value)) throw new Error(`[validator] ${label}: INVALID\n${ajv.errorsText(v.errors)}`);
  };

  const featureRoot = path.join(outDir, "lib", "features", ir.name);
  const coreDir = path.join(outDir, "lib", "core");
  fs.rmSync(path.join(outDir, "lib"), { recursive: true, force: true }); // clean stale output
  fs.mkdirSync(coreDir, { recursive: true });
  const files: string[] = [];

  for (const entry of registry) {
    const items = (ir as any)[entry.irKey] ?? [];
    for (const item of items) {
      check(`${entry.schema}:${entry.label(item)}`, validators[entry.schema], item);
      const dir = path.join(featureRoot, entry.layer);
      fs.mkdirSync(dir, { recursive: true });
      const f = path.join(dir, entry.file(item));
      fs.writeFileSync(f, entry.generate(item, ctx));
      files.push(f);
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
  }

  const core: [string, string][] = [
    ["di.dart", generateDi(ir, ctx)],
    ["router.dart", generateRoutes(ir, ctx)],
    ["components.dart", generateComponents(ir)],
    ["app_strings.dart", generateLocalization(ir)],
    ["theme.dart", generateTheme(ir)],
    ["config.dart", generateConfig(ir)],
    ["secrets.dart", generateSecrets(ir)],
    ["observability.dart", generateObservability(ir)],
    ["validator.dart", generateValidator(ir)],
  ];
  for (const [f, content] of core) { const p = path.join(coreDir, f); fs.writeFileSync(p, content); files.push(p); }

  fs.writeFileSync(path.join(outDir, "lib", "generated.dart"), generateBarrel(ir, ctx));
  fs.writeFileSync(path.join(outDir, "lib", "main.dart"), generateMain(ir));
  fs.writeFileSync(path.join(outDir, "pubspec.yaml"), generatePubspec(ir));
  fs.writeFileSync(path.join(outDir, "builder.lock.json"), JSON.stringify({
    irVersion, generator: "1.0.0", template: "v1", sdk: ">=3.0.0",
    plugins: { stateManagement: "bloc", di: "get_it", routing: "go_router", http: "dio", secureStorage: "flutter_secure_storage" },
  }, null, 2));
  const testDir = path.join(outDir, "test");
  fs.mkdirSync(testDir, { recursive: true });
  fs.writeFileSync(path.join(testDir, "widget_test.dart"), generateWidgetTest(ir));
  fs.writeFileSync(path.join(testDir, "unit_test.dart"), generateUnitTest(ir));
  fs.writeFileSync(path.join(testDir, "flow_test.dart"), generateFlowTest(ir));
  fs.writeFileSync(path.join(testDir, "golden_test.dart"), generateGoldenTest(ir));

  return { outDir, fileCount: files.length + 9, scoring };
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

  const result = generateApp(raw as FeatureModel, outDir, raw.schemaVersion);
  console.log(`[context] generator=1.0.0 irVersion=${raw.schemaVersion}`);
  result.scoring.forEach((s) => console.log(`[scoring] ${s}`));
  console.log(`Generated ${result.fileCount} file(s) → ${outDir}`);
}

if (require.main === module) main();
