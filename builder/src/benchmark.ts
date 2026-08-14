import * as fs from "fs";
import { fileName } from "./dart";

/**
 * Benchmark: 
 *  - SEMANTIC (default): does the generated app DO the same things the requirements say?
 *    (concepts + behaviors + field coverage — the WHAT, not the HOW)
 *  - STRUCTURAL (--structural): does the generated Dart match a reference codebase field-for-field?
 *    (the HOW — used only to validate the generator's correctness against a real fixture)
 */

interface Field {
  name: string;
  type: string;
}

function parseFields(dart: string): Field[] {
  const fields: Field[] = [];
  const re = /^\s*final\s+([\w<>,.?\s]+?)\s+(\w+)\s*;/gm;
  let m: RegExpExecArray | null;
  while ((m = re.exec(dart)) !== null) {
    fields.push({ name: m[2] ?? "", type: (m[1] ?? "").replace(/\s+/g, "") });
  }
  return fields;
}

function semanticBenchmark(reqPath: string, irPath: string): void {
  const req = JSON.parse(fs.readFileSync(reqPath, "utf8"));
  const ir = JSON.parse(fs.readFileSync(irPath, "utf8"));

  const concepts: { name: string; fields: string[] }[] = [];
  for (const f of req.features ?? []) {
    for (const c of f.concepts ?? []) {
      concepts.push({ name: c.name, fields: (c.fields ?? []).map((x: any) => (typeof x === "string" ? x : x.name)) });
    }
  }

  const entities = ir.entities ?? [];
  const entityNames: string[] = entities.map((e: any) => e.name);
  const fieldNames: Record<string, string[]> = {};
  for (const e of entities) fieldNames[e.name] = (e.fields ?? []).map((f: any) => f.name);

  console.log("=== SEMANTIC PARITY (the WHAT) — requirements → IR ===\n");

  console.log("Concepts (entities):");
  let conceptOk = 0;
  for (const c of concepts) {
    const match = entityNames.find((n: string) => n === c.name || n === `${c.name}Entity` || n.includes(c.name));
    const fcov = match ? c.fields.filter((f) => fieldNames[match]?.some((n) => n === f || n.includes(f))).length : 0;
    if (match) conceptOk++;
    console.log(`  ${match ? "✅" : "❌"} ${c.name} → ${match ?? "MISSING"}  (fields ${fcov}/${c.fields.length})`);
  }
  console.log(`  concepts: ${conceptOk}/${concepts.length}\n`);

  const opNames: string[] = (ir.repositories ?? []).flatMap((r: any) => (r.operations ?? []).map((o: any) => o.name));
  const tokens = (s: string) => s.split(/(?=[A-Z])/).map((t) => t.toLowerCase()).filter((t) => !["view", "get", "list", "do", "show", "read", "watch", "submit", "create", "update", "delete"].includes(t));
  const matches = (b: string, o: string) => {
    const bt = tokens(b), ot = tokens(o);
    return bt.length > 0 && bt.every((t) => ot.includes(t));
  };
  console.log("Behaviors (operations):");
  let behOk = 0;
  for (const b of req.behaviors ?? []) {
    const ok = opNames.some((o) => matches(b.name, o));
    if (ok) behOk++;
    console.log(`  ${ok ? "✅" : "❌"} ${b.name}: ${b.capability}`);
  }
  console.log(`  behaviors: ${behOk}/${(req.behaviors ?? []).length}`);
}

function structuralBenchmark(realRoot: string, genRoot: string): void {
  const entities = [
    { name: "TransactionEntity", real: `${realRoot}/lib/features/home/domain/entities/transaction_entity.dart` },
    { name: "TransactionItemEntity", real: `${realRoot}/lib/features/home/domain/entities/transaction_item_entity.dart` },
    { name: "TransactionAttachmentEntity", real: `${realRoot}/lib/features/home/domain/entities/transaction_attachment_entity.dart` },
    { name: "ExpensePaymentEntity", real: `${realRoot}/lib/features/home/domain/entities/expense_payment_entity.dart` },
  ];

  console.log("\n=== STRUCTURAL PARITY (the HOW) — generated vs reference fixture ===\n");
  console.log("entity | real | gen | coverage | type-match");
  let totalReal = 0, totalCovered = 0;
  for (const e of entities) {
    const genPath = `${genRoot}/${fileName(e.name)}`;
    if (!fs.existsSync(genPath)) { console.log(`${e.name}: generated file missing, skipped`); continue; }
    const real = parseFields(fs.readFileSync(e.real, "utf8"));
    const gen = parseFields(fs.readFileSync(genPath, "utf8"));
    const genByName = new Map(gen.map((f) => [f.name, f]));
    const missing = real.filter((f) => !genByName.has(f.name));
    let typeMatch = 0;
    for (const rf of real) if (genByName.get(rf.name)?.type === rf.type) typeMatch++;
    totalReal += real.length; totalCovered += real.length - missing.length;
    console.log(`${e.name} | ${real.length} | ${gen.length} | ${((real.length - missing.length) / real.length * 100).toFixed(0)}% | ${(typeMatch / (real.length || 1) * 100).toFixed(0)}%`);
  }
  console.log(`\naggregate field coverage: ${totalCovered}/${totalReal} (${(totalCovered / (totalReal || 1) * 100).toFixed(1)}%)`);
}

function main() {
  const args = process.argv.slice(2);
  if (args.includes("--structural")) {
    const realRoot = args[args.indexOf("--structural") + 1] ?? "/Users/username/Documents/cto/Rasheed/rasheedapp";
    const genRoot = args[args.indexOf("--structural") + 2] ?? "builder/output/rasheed_replica/lib/generated";
    structuralBenchmark(realRoot, genRoot);
  } else {
    const reqPath = args[0] ?? "builder/samples/requirements.json";
    const irPath = args[1] ?? "builder/samples/expense.semantic.ir.json";
    semanticBenchmark(reqPath, irPath);
  }
}

main();
