import * as fs from "fs";
import { humanAttestAll, unapprovedElements } from "./provenance";

/**
 * Human approval gate (DESIGN §9.2) — attests `actor: human:attested` on the
 * pending LLM-inferred elements so generation can proceed.
 *
 * Usage: builder/src/approve.ts <ir-file>
 * This is the human-in-the-loop step the RequirementAgent's output requires.
 */

export function approve(ir: any): { before: number; after: number } {
  const before = unapprovedElements(ir).length;
  humanAttestAll(ir);
  const after = unapprovedElements(ir).length;
  return { before, after };
}

export function main(): void {
  const path = process.argv[2];
  if (!path) { console.error("usage: approve.ts <ir-file>"); process.exit(1); }
  const ir = JSON.parse(fs.readFileSync(path, "utf8"));
  const { before, after } = approve(ir);
  fs.writeFileSync(path, JSON.stringify(ir, null, 2));
  console.log(`[approve] ${before} element(s) human-attested; ${after} remaining unapproved.`);
  process.exit(after === 0 ? 0 : 1);
}

if (require.main === module) main();
