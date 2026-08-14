import * as fs from "fs";
import { execSync } from "child_process";
import { stampAgentProvenance } from "./provenance";

/**
 * RequirementAgent (Phase 3) — natural language → validated IR.
 * Uses an LLM (opencode/deepseek-v4-flash by default) to reason, but the output is
 * schema-validated by the deterministic pipeline — the trust boundary (DESIGN §9.1).
 * Agent output is tagged with provenance (actor=agent:requirement, origin=llm-inferred,
 * requiresApproval=true) and is BLOCKED from generation until a human attests (§9.2).
 */

const MODEL = "opencode/deepseek-v4-flash-free";

const SYSTEM = `You are the DomainAgent of a deterministic Flutter app generator. Convert the user's natural-language requirement into a JSON IR that matches this schema exactly.

Output ONLY valid JSON (no markdown, no commentary). The IR shape:

{
  "schemaVersion": "1",
  "name": "snake_case_app_name",
  "enums": [ { "name": "PascalCase", "values": ["camelCase", ...] } ],
  "entities": [ {
    "name": "PascalCase",
    "identity": { "field": "id" },
    "fields": [
      { "name": "camelCase", "type": "String|int|double|bool|DateTime|enum|List|reference", "required": true|false, "nullable": true|false, "of": "ReferencedTypeOrEnumName", "default": "value" }
    ]
  } ],
  "queries": [ { "name": "PascalCaseFilter", "fields": [ { "name": "...", "type": "..." } ] } ],
  "repositories": [ { "name": "PascalCaseRepository", "operations": [ { "name": "camelCase", "returns": "Future<X>|Stream<X>|Future<void>", "params": [ { "name": "...", "type": "...", "named": false } ] } ] } ],
  "states": [ { "name": "PascalCaseList", "entity": "EntityName", "statuses": ["initial","loading","success","failure"] } ],
  "screens": [ { "name": "PascalCaseScreen", "entity": "EntityName", "type": "list|detail", "state": "StateName" } ],
  "useCases": [ { "name": "ListPascalCase", "repository": "RepoName", "operation": "listX", "paramType": "Filter", "returnType": "List<Entity>" } ]
}

Rules: fields use camelCase names; types are the Dart-ish names above; a List field has "of" = item entity; a reference field has "of" = target entity; an enum field has "of" = enum name. Keep it minimal but faithful to the requirement.`;

function extractJson(text: string): any {
  // strip ANSI, find the JSON object (first { to last })
  const clean = text.replace(/\x1b\[[0-9;]*m/g, "");
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("[requirements] no JSON object in LLM output");
  return JSON.parse(clean.slice(start, end + 1));
}

export function run(requirement: string, outPath: string, model = MODEL): any {
  const prompt = `${SYSTEM}\n\nRequirement:\n${requirement}\n\nOutput ONLY the JSON IR:`;
  console.log(`[requirements] reasoning with ${model} …`);
  const raw = execSync(`opencode run -m ${model} --auto ${JSON.stringify(prompt)}`, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  const ir = extractJson(raw);
  if (typeof ir.schemaVersion !== "string") ir.schemaVersion = "1";
  stampAgentProvenance(ir, "requirement", "llm-inferred", 0.6);
  fs.writeFileSync(outPath, JSON.stringify(ir, null, 2));
  console.log(`[requirements] IR written → ${outPath} (origin=llm-inferred, requiresApproval=true — run approve.ts to attest)`);
  return ir;
}

export function main(): void {
  const args = process.argv.slice(2);
  const reqPath = args[0];
  const outPath = args[1] ?? "builder/samples/from_requirements.ir.json";
  if (!reqPath) { console.error("usage: requirements.ts <requirement-file|text> [out-ir]"); process.exit(1); }
  const requirement = fs.existsSync(reqPath) ? fs.readFileSync(reqPath, "utf8") : reqPath;
  run(requirement, outPath);
}

if (require.main === module) main();
