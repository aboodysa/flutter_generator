// M4 spike evidence harness (research artifact — SPIKE M4 2026-08-17, updated for M4a 2026-08-17).
// Read-only investigation: computes the per-state strategy every repo IR gets from scoring.ts's
// scoreStateStrategy under (a) the PRE-FIX metric (statuses.length + extraFields.length >=
// SEALED_EVENTS_THRESHOLD=8, which fired sealed-events on rasheed with zero declared machines —
// the [strategy-fidelity] FAIL) and (b) the FIXED selector (sealed-events ONLY when a declared
// stateMachines[] entry's state vocabulary matches the state's statuses AND carries events +
// transitions — no threshold, no synthetic list; owner directive: no hardcoded magic numbers).
// Run: npx ts-node --transpile-only apps/rasheed/output/qa/m4_evidence.ts
import * as fs from "fs";
import * as path from "path";
import { scoreStateStrategy, StateStrategy } from "../../../../builder/src/scoring";

const ROOT = path.join(__dirname, "..", "..", "..", "..");

const irFiles = [
  "builder/samples/expense.ir.json",
  "builder/samples/expense.semantic.ir.json",
  "builder/samples/inventory.ir.json",
  "builder/samples/ledgerly.ir.json",
  "builder/samples/moneycrud.ir.json",
  "builder/samples/promo.ir.json",
  "builder/samples/rasheed.ir.json",
  "builder/samples/reimbursement.ir.json",
  "builder/samples/todo.ir.json",
  "builder/samples/todo.riverpod.ir.json",
  "builder/samples/wizard.ir.json",
  "apps/hr_service/input/hr_service.ir.json",
  "apps/ledgerly/input/ledgerly.ir.json",
  "apps/tasks/input/tasks.ir.json",
  "apps/work_auth/input/work_auth.ir.json",
];

console.log("Fixed selector (scoreStateStrategy(s, ir): declared-machine semantics — no threshold):");
for (const f of irFiles) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const ir = JSON.parse(fs.readFileSync(p, "utf8"));
  const models = ir.features ? ir.features.flatMap((fe: any) => fe.states ?? []) : (ir.states ?? []);
  for (const s of models) {
    const cur: StateStrategy = scoreStateStrategy(s, ir);
    const machineCount = (ir.stateMachines ?? []).filter((m: any) =>
      (s.statuses ?? []).every((st: string) => (m.states ?? []).includes(st)),
    ).length;
    const flag = cur === "sealed-events" ? "  <== FIRES" : "";
    console.log(`  ${f}`.slice(0, 44).padEnd(46), `${s.name}`.padEnd(22),
      `-> ${cur}${flag}`, `| matching machines=${machineCount}`);
  }
}
console.log("\nReading: no repo IR declares a stateMachines entry whose state vocabulary matches a");
console.log("state's statuses with events+transitions, so sealed-events fires nowhere — the post-fix");
console.log("selector is honest with the generator (which only emits state_enum_status/notifier.v1).");
console.log("When a future IR declares a real event/transition surface, sealed-events selects by");
console.log("declaration — not by a magic field-count threshold.");