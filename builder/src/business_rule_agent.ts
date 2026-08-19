import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import Ajv from "ajv";
import { RuleModel, RuleCondition, FeatureModel, EntityModel } from "./types";
import { stampAgentProvenance } from "./provenance";
import { normalizeExpression, fieldsInExpression } from "./expression";

/**
 * BusinessRuleAgent (Phase 3a) — natural-language business rules → validated RuleModel[].
 * The semantic-lane sibling of RequirementAgent (structural). Uses an LLM to reason, but
 * the output is schema-validated + entity/field cross-checked before it can reach the IR —
 * the trust boundary (DESIGN §9.1). Agent output is tagged origin=llm-inferred,
 * requiresApproval=true (DESIGN §9.2) and stays blocked until a human attests via approve.ts.
 * Anything unexpressible in the closed rule language (§19) goes to `extensionQueue`,
 * never a fabricated rule.
 */

export interface ExtensionQueueEntry {
  rule: string;
  reason: string;
}

export interface ParsedAgentOutput {
  businessRules: RuleModel[];
  extensionQueue: ExtensionQueueEntry[];
  errors: string[];
}

// Compiled once at module load: a dependency the pure function below closes over,
// not I/O it performs per call (DIP — parseAgentOutput itself touches no fs/process).
const ajv = new Ajv({ allErrors: true, strict: false });
const ruleSchema = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "schemas", "rule.schema.json"), "utf8"));
const validateRule = ajv.compile<RuleModel>(ruleSchema);

/** Extract the JSON object from raw LLM output (mirrors requirements.ts's extractJson). */
export function extractJson(text: string): any {
  const clean = text.replace(/\x1b\[[0-9;]*m/g, "");
  const start = clean.indexOf("{");
  const end = clean.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) throw new Error("[business_rule_agent] no JSON object in output");
  return JSON.parse(clean.slice(start, end + 1));
}

function entityFieldNames(entity: EntityModel): Set<string> {
  return new Set(entity.fields.map((f) => f.name));
}

/** Field names referenced by a condition list that are NOT real fields on the entity. */
function unknownFields(conditions: RuleCondition[] | undefined, fields: Set<string>): string[] {
  return (conditions ?? []).map((c) => c.field).filter((f) => !fields.has(f));
}

/**
 * Pure function: no LLM call, no I/O. Parses raw agent text, schema-validates each
 * candidate rule, cross-checks it against the real entity/field vocabulary (the trust
 * boundary — an agent cannot invent a field that doesn't exist), and stamps surviving
 * rules with agent provenance. Never throws on a malformed candidate; malformed input
 * is reported in `errors` and the rule is dropped.
 */
export function parseAgentOutput(text: string, entityContext: FeatureModel): ParsedAgentOutput {
  const businessRules: RuleModel[] = [];
  const extensionQueue: ExtensionQueueEntry[] = [];
  const errors: string[] = [];

  let parsed: any;
  try {
    parsed = extractJson(text);
  } catch (e) {
    errors.push((e as Error).message);
    return { businessRules, extensionQueue, errors };
  }

  for (const entry of parsed.extensionQueue ?? []) {
    if (entry && typeof entry.rule === "string" && typeof entry.reason === "string") {
      extensionQueue.push({ rule: entry.rule, reason: entry.reason });
    } else {
      errors.push(`[extensionQueue] malformed entry: ${JSON.stringify(entry)}`);
    }
  }

  for (const candidate of parsed.businessRules ?? []) {
    const label = candidate?.name ?? "<unnamed>";

    // BREL additive slice: normalize any expression tree the agent produced (flat or already
    // nested) to the canonical Comparison(left,op,right) shape before schema validation — see
    // expression.ts's normalizeExpression doc.
    if (candidate && candidate.expression !== undefined) {
      try {
        candidate.expression = normalizeExpression(candidate.expression);
      } catch (e) {
        errors.push(`[expression] ${label}: ${(e as Error).message}`);
        continue;
      }
    }

    if (!validateRule(candidate)) {
      errors.push(`[schema] ${label}: ${ajv.errorsText(validateRule.errors)}`);
      continue;
    }

    const entity = entityContext.entities.find((e) => e.name === candidate.entity);
    if (!entity) {
      errors.push(`[trust] ${label}: unknown entity '${candidate.entity}'`);
      continue;
    }

    const fields = entityFieldNames(entity);
    const bad = [
      ...unknownFields(candidate.conditions, fields),
      ...((candidate.rows ?? []) as { conditions?: RuleCondition[] }[]).flatMap((r) => unknownFields(r.conditions, fields)),
      // BREL additive slice: the trust boundary (§9.2) applies equally to expression-tree field refs.
      ...(candidate.expression ? fieldsInExpression(candidate.expression).filter((f) => !fields.has(f)) : []),
    ];
    if (bad.length) {
      errors.push(`[trust] ${label}: unknown field(s) on ${candidate.entity}: ${[...new Set(bad)].join(", ")}`);
      continue;
    }

    businessRules.push(candidate as RuleModel);
  }

  // Trust boundary (§9.2): agent-produced rules are llm-inferred + blocked until a human attests.
  stampAgentProvenance({ businessRules }, "businessRule", "llm-inferred", 0.6);

  return { businessRules, extensionQueue, errors };
}

function systemPrompt(entityContext: FeatureModel): string {
  const entityDescriptions = entityContext.entities
    .map((e) => `  - ${e.name}: ${e.fields.map((f) => `${f.name}:${f.type}${f.of ? `<${f.of}>` : ""}`).join(", ")}`)
    .join("\n");

  return `You are the BusinessRuleAgent of a deterministic Flutter app generator. Convert the user's natural-language business rule(s) into RuleModel JSON that matches this closed, typed rule language exactly (DESIGN §19).

Output ONLY valid JSON (no markdown, no commentary):
{ "businessRules": [ RuleModel, ... ], "extensionQueue": [ { "rule": "name", "reason": "..." }, ... ] }

RuleModel — three forms:
- Flat: { "name": "camelCase", "entity": "EntityName", "conditions": [ {"field","operator","value"} ], "result": "outcome" } — all conditions AND'd.
- Decision table: { "name": ..., "entity": ..., "conditions": [], "result": "defaultOutcome", "rows": [ { "outcome": "...", "conditions": [ {"field","operator","value"} ] }, ... ] } — first matching row (top to bottom) wins; "result" is the fallback when no row matches. "conditions": [] is still required even when using "rows".
- Expression tree (use ONLY when you need "or"/"not" — logic the flat AND-only form can't express): { "name": ..., "entity": ..., "conditions": [], "result": "outcome", "expression": { "or": [ {"field":"q1Answer","operator":"==","value":"a"}, {"field":"q1Answer","operator":"==","value":"b"} ] } }. "conditions": [] is still required even when using "expression". Combinators: {"and":[expr,...]}, {"or":[expr,...]}, {"not":expr}; leaves are {"field","operator","value"} (same as flat conditions) or a function call {"fn":"daysSince","args":[{"field":"endDate"}],"op":">","value":0} for temporal checks (fn registry: daysSince, daysUntil, isBefore, isAfter, isBetween).

Operators: >= <= > < == != contains daysSince> daysSince< . daysSince* compares a DateTime field against "value" = a day count, e.g. {"field":"endDate","operator":"daysSince>","value":"0"} means endDate is more than 0 days in the past. Inside "expression" only, additional operators are available: startsWith endsWith matches in notIn isNull isNotNull isEmpty isNotEmpty.

Entities available — "field" MUST be a real field of the named entity, verbatim:
${entityDescriptions}

Anything you cannot express in this language — quantifiers over collections ("top N", "any/all of a list"), cross-entity logic, arbitrary computation, subjective judgment — do NOT invent a rule for it. Push it to "extensionQueue": [{"rule": "<short name>", "reason": "<why it doesn't fit the closed rule language>"}] instead. Never fabricate a rule that doesn't actually hold.`;
}

const MODEL = "opencode/deepseek-v4-pro";

/** Live wrapper: calls the LLM, then runs the pure parse/validate/stamp pipeline above. */
export function run(nlText: string, entityContext: FeatureModel, outPath: string, model = MODEL): ParsedAgentOutput {
  const prompt = `${systemPrompt(entityContext)}\n\nBusiness rule requirement:\n${nlText}\n\nOutput ONLY the JSON:`;
  console.log(`[business_rule_agent] reasoning with ${model} …`);
  const raw = execSync(`opencode run -m ${model} --auto ${JSON.stringify(prompt)}`, { encoding: "utf8", maxBuffer: 10 * 1024 * 1024 });
  const result = parseAgentOutput(raw, entityContext);
  fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
  console.log(
    `[business_rule_agent] ${result.businessRules.length} rule(s) validated, ${result.extensionQueue.length} to extension queue, ${result.errors.length} error(s) → ${outPath}`,
  );
  return result;
}

export function main(): void {
  const args = process.argv.slice(2);
  const fixtureIdx = args.indexOf("--fixture");
  const fixturePath = fixtureIdx !== -1 ? args[fixtureIdx + 1] : undefined;
  const positional = fixtureIdx !== -1 ? [...args.slice(0, fixtureIdx), ...args.slice(fixtureIdx + 2)] : args;
  const [nlPath, entityIrPath, outArg] = positional;

  if (!nlPath || !entityIrPath) {
    console.error("usage: business_rule_agent.ts <nl-file> <entity-ir> [out-fragment] [--fixture <file>]");
    process.exit(1);
  }
  const outPath = outArg ?? "builder/samples/from_business_rules.fragment.json";
  const entityContext = JSON.parse(fs.readFileSync(entityIrPath, "utf8")) as FeatureModel;

  if (fixturePath) {
    const text = fs.readFileSync(fixturePath, "utf8");
    const result = parseAgentOutput(text, entityContext);
    fs.writeFileSync(outPath, JSON.stringify(result, null, 2));
    console.log(
      `[business_rule_agent] (fixture) ${result.businessRules.length} rule(s) validated, ${result.extensionQueue.length} to extension queue, ${result.errors.length} error(s) → ${outPath}`,
    );
    return;
  }

  const nlText = fs.existsSync(nlPath) ? fs.readFileSync(nlPath, "utf8") : nlPath;
  run(nlText, entityContext, outPath);
}

if (require.main === module) main();
