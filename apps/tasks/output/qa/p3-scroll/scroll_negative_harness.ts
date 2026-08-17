// P3 [scroll] gate — output-side negative control harness (rule 12, apps/<app>/artifact layout).
// Proves scrollCheck() catches a generated screen that is MISSING its NotificationListener
// (the deterministic core's output-side negative), without going through validateOutput — a
// hand-edit to lib/ trips the pre-existing [determinism] diff gate first, which is by design
// (validateOutput assumes a freshly generated outDir). Run from repo root:
//   npx ts-node --transpile-only apps/tasks/output/qa/p3-scroll/scroll_negative_harness.ts
import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { scrollCheck } from "../../../../../builder/src/validate";

const IR = path.join(__dirname, "../../../input/tasks.ir.json");
const OUT = path.join(__dirname, "../scroll_neg_tmp");
const SCREEN = path.join(OUT, "lib/features/tasks/presentation/screens/task_list_screen.dart");

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".dart")) out.push(p);
  }
  return out;
}

execSync(`npx ts-node --transpile-only builder/src/index.ts ${IR} ${OUT}`, { stdio: "pipe" });
const ir = JSON.parse(fs.readFileSync(IR, "utf8"));
const files = walk(path.join(OUT, "lib"));

let failures = 0;

// Control: unmodified output must pass scrollCheck cleanly.
const clean = scrollCheck(ir, OUT, files);
console.log(`control (unmodified): ${clean.length === 0 ? "PASS" : "FAIL " + JSON.stringify(clean)}`);
if (clean.length > 0) failures++;

// Negative: strip the listener body-wrappers from the list screen, keep the AppBar tint static.
let src = fs.readFileSync(SCREEN, "utf8");
src = src.replace(/body: NotificationListener<ScrollNotification>\([\s\S]*?child: /, "body: ");
src = src.replace(/\n        \),\n      \),?/, "");
fs.writeFileSync(SCREEN, src);
const negated = scrollCheck(ir, OUT, files);
const hit = negated.some((s) => s.includes("(TaskListScreen) is in patterns.scroll") && s.includes("has no NotificationListener"));
console.log(`negative (listener stripped): ${hit ? "PASS" : "FAIL " + JSON.stringify(negated)}`);
if (!hit) failures++;

console.log(failures === 0 ? "\nHARNESS PASSED" : "\nHARNESS FAILED");
fs.rmSync(OUT, { recursive: true, force: true });
process.exit(failures === 0 ? 0 : 1);