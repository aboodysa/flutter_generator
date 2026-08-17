// M4 spike evidence harness (research artifact — SPIKE M4, 2026-08-17).
// Read-only investigation: computes the per-state strategy every repo IR would
// get from scoring.ts's scoreStateStrategy under (a) the CURRENT metric
// (statuses.length + extraFields.length >= SEALED_EVENTS_THRESHOLD=8) and
// (b) the DESIGN §5.2-STATED metric (stateMachines[] state/transition/guard
// surface), to show which metric explains the mismatch on rasheed.
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

function smMetric(ir: any, s: any): number {
  // DESIGN §5.2: "stateComplexity is computed from the already-declared
  // stateMachines[] shape (state count, transition count, guard presence)".
  const machines = (ir.stateMachines ?? []).filter((m: any) =>
    m.name === s.name || (s.entity && m.name === s.entity),
  );
  let c = 0;
  for (const m of machines) {
    c += (m.states?.length ?? 0) + (m.transitions?.length ?? 0);
    c += (m.transitions ?? []).filter((t: any) => t.guard).length;
  }
  return c;
}

console.log("Current selector (scoreStateStrategy: statuses+extraFields >= 8) vs DESIGN §5.2 metric (stateMachines surface):");
for (const f of irFiles) {
  const p = path.join(ROOT, f);
  if (!fs.existsSync(p)) continue;
  const ir = JSON.parse(fs.readFileSync(p, "utf8"));
  const models = ir.features ? ir.features.flatMap((fe: any) => fe.states ?? []) : (ir.states ?? []);
  for (const s of models) {
    const cur: StateStrategy = scoreStateStrategy(s);
    const alt = smMetric(ir, s);
    const curC = (s.statuses ?? ["initial", "loading", "success", "failure"]).length + (s.extraFields ?? []).length;
    const flag = cur === "sealed-events" ? "  <== FIRES" : "";
    console.log(`  ${f}`.slice(0, 44).padEnd(46), `${s.name}`.padEnd(22),
      `current(idx=${curC}) -> ${cur}${flag}`, `| sm-metric=${alt}`);
  }
}
console.log("\nReading: only rasheed crosses under the CURRENT metric; under a stateMachines-driven");
console.log("metric rasheed (zero stateMachines) would NOT fire — the sealed selection is driven by");
console.log("data-field count (5 statuses + 6 extraFields), not by any transition/event surface.");