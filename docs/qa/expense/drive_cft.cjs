// CFT driver (Chrome for Testing, malls-app pattern) — drives a generated Flutter web
// app served at APP_URL and asserts: app boots, screen renders, no console/network errors.
// Requires: CFT on :9222 (DRIVERS_GUIDE flags), app served at APP_URL.
// Run: NODE_PATH=/Users/username/Documents/cto/mall_directory/node_modules node drive_cft.mjs
const puppeteer = require("puppeteer-core");

const CDP = process.env.CDP ?? "http://127.0.0.1:9222";
const APP_URL = process.env.APP_URL ?? "http://127.0.0.1:8123";
const OUT = process.env.OUT ?? "cft-report";
const WAIT_MS = Number(process.env.WAIT_MS ?? 30000);

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitFor(fn, timeoutMs, label) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try { const v = await fn(); if (v) return v; } catch {}
    await sleep(500);
  }
  throw new Error(`timeout waiting for ${label}`);
}

async function main() {
const browser = await puppeteer.connect({ browserURL: CDP, defaultViewport: { width: 1400, height: 900 } });
const page = await browser.newPage();
const consoleErrors = [];
const failedRequests = [];
page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
page.on("requestfailed", (r) => failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`));

await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 30000 });

await waitFor(async () => page.evaluate(() => !!document.querySelector("flutter-view")), WAIT_MS, "flutter-view (app boot)");
await sleep(2000); // let first frame + semantics settle

const text = await page.evaluate(() => document.body.innerText ?? "");
const hasTitle = /TransactionListScreen|TaskListScreen|ProductListScreen|Generated app/.test(text);
const hasRow = /Sample item/.test(text);
const semanticsNodes = await page.evaluate(() => document.querySelectorAll("flt-semantics, [aria-label]").length);

// benign: favicon 404
const netErrors = failedRequests.filter((u) => !/favicon/i.test(u));
const consoleClean = consoleErrors.length === 0;

const report = {
  app: APP_URL,
  booted: true,
  hasScreenTitle: hasTitle,
  hasDataRow: hasRow,
  semanticsNodes,
  consoleErrors,
  consoleClean,
  netErrors,
  passed: hasTitle && hasRow && consoleClean && netErrors.length === 0,
};
console.log(JSON.stringify(report, null, 2));

await page.screenshot({ path: `${OUT}.png`, fullPage: true });
await page.close();
process.exit(report.passed ? 0 : 1);
}

main().catch((e) => { console.error("CFT driver failed:", e.message); process.exit(1); });
