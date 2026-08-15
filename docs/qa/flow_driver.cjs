// Parameterized CDP flow driver (P8 Phase A / F3) — extends drive_cft.cjs's one-shot boot check
// into a full list -> create -> detail -> update -> delete walk against a generated Flutter web
// app, asserting each step and capturing an iPhone-size (390x844) screenshot per step.
// Re-runnable per sample: set FLOW_CONFIG to a name in CONFIGS below, or FLOW_CONFIG_FILE to a
// JSON file with the same shape ({ entity, field, createValue, updateValue }).
//
// Locator strategy below matches research/cdp_flow_test.json's INTENT (semantics-only, never
// canvas coordinates; type via real keystrokes, never el.value=) but was empirically corrected
// against this Flutter/Chrome build's actual semantics DOM (verified with CFT before writing
// this file — see the task report):
//   - buttons (FloatingActionButton/IconButton/FilledButton, all tooltip-labeled by screen.ts):
//     `flt-semantics[role="button"]` with the label as the node's TEXT CONTENT, not an
//     `aria-label` ATTRIBUTE (this build never sets aria-label on the button wrapper).
//   - text fields (TextField/TextFormField): the underlying real `<input aria-label="...">`
//     DOES carry `aria-label` as an attribute — query it directly, no flt-semantics indirection.
//   - clicking: `flt-semantics` nodes need a genuine CDP pointer event at their screen
//     coordinates (`page.mouse.click`) — a synthetic `el.click()` DOM call is silently ignored by
//     Flutter's gesture layer (confirmed: FAB responded to `.click()`, "Create" did not).
//   - routing: this app uses go_router's default hash strategy (`#/task/new`, not a path), so URL
//     assertions read `location.href`, not `location.pathname`.
//   - waitFor 2-identical-semantics-samples, never a fixed sleep, before every assertion.
//
// Run: NODE_PATH=<dir with puppeteer-core> node docs/qa/flow_driver.cjs
// Env: CDP (default http://127.0.0.1:9222), APP_URL (default http://127.0.0.1:8123),
//      OUT (default docs/qa/flow-out), FLOW_CONFIG (name below) or FLOW_CONFIG_FILE, WAIT_MS.
const fs = require("fs");
const path = require("path");
const puppeteer = require("puppeteer-core");

const CDP = process.env.CDP ?? "http://127.0.0.1:9222";
const APP_URL = process.env.APP_URL ?? "http://127.0.0.1:8123";
const OUT = process.env.OUT ?? "docs/qa/flow-out";
const WAIT_MS = Number(process.env.WAIT_MS ?? 20000);
const VIEWPORT = { width: 390, height: 844 }; // iPhone-size, matches the golden test viewport

// Per-sample flow config: which entity's list/create/detail/update/delete to drive, which field
// to type into, and what to type. Adding a new sample = one entry here (or a JSON file).
// createValue/updateValue are deliberately non-overlapping substrings of each other — the
// "update" assertion checks the old value is GONE, and "X".includes("X-prefix") is a classic
// false-negative trap (caught during verification: see the task report).
const CONFIGS = {
  todo: { entity: "Task", field: "Title", createValue: "CDP Flow Alpha", updateValue: "Renamed Beta Value" },
  "expense.semantic": { entity: "Transaction", field: "Merchant", createValue: "CDP Flow Alpha", updateValue: "Renamed Beta Value" },
};

function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function waitForCond(fn, timeoutMs, label) {
  const start = Date.now();
  let lastErr;
  while (Date.now() - start < timeoutMs) {
    try {
      const v = await fn();
      if (v) return v;
    } catch (e) { lastErr = e; }
    await sleep(300);
  }
  throw new Error(`timeout waiting for ${label}${lastErr ? `: ${lastErr.message}` : ""}`);
}

// "pumpAndSettle" equivalent for a page we don't control the test harness of: poll the semantics
// tree's text content until two consecutive samples (~500ms apart) are identical.
async function waitSemanticsStable(page, timeoutMs = 6000) {
  const snapshot = () => page.evaluate(() => document.body.innerText || "");
  const start = Date.now();
  let prev = await snapshot();
  while (Date.now() - start < timeoutMs) {
    await sleep(500);
    const cur = await snapshot();
    if (cur === prev) return cur;
    prev = cur;
  }
  return prev;
}

async function findButtonBox(page, label) {
  return waitForCond(() => page.evaluate((label) => {
    const btns = [...document.querySelectorAll('flt-semantics[role="button"]')];
    const b = btns.find((e) => (e.textContent || "").trim() === label);
    if (!b) return null;
    const r = b.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return null;
    return { x: r.x + r.width / 2, y: r.y + r.height / 2 };
  }, label), WAIT_MS, `button[text="${label}"]`);
}

async function clickButton(page, label) {
  const box = await findButtonBox(page, label);
  await page.mouse.click(box.x, box.y);
}

async function findInput(page, fieldLabel) {
  const sel = `input[aria-label="${fieldLabel}"], textarea[aria-label="${fieldLabel}"]`;
  await waitForCond(() => page.$(sel), WAIT_MS, `input[aria-label="${fieldLabel}"]`);
  return page.$(sel);
}

async function typeInto(page, fieldLabel, text) {
  const handle = await findInput(page, fieldLabel);
  await handle.click(); // focus
  // Select the existing value via the DOM selection API (not `.value =` — this only moves the
  // cursor/selection, the same state a user's triple-click would leave) so a single real
  // Backspace reliably clears it before typing. A bare `click({clickCount: 3})` + one Backspace
  // proved racy here: the selection hadn't registered yet, so Backspace deleted just the last
  // character and typing appended after the leftover prefix (caught by this driver's own
  // "update" assertion — see the task report).
  await page.evaluate((el) => el.setSelectionRange(0, el.value.length), handle);
  await page.keyboard.press("Backspace");
  await handle.type(text, { delay: 12 }); // real CDP keystrokes, never el.value=
}

async function screenshotStep(page, dir, step) {
  fs.mkdirSync(dir, { recursive: true });
  await page.screenshot({ path: path.join(dir, `${step}.png`) });
}

async function main() {
  const cfgName = process.env.FLOW_CONFIG ?? "todo";
  const cfg = process.env.FLOW_CONFIG_FILE
    ? JSON.parse(fs.readFileSync(process.env.FLOW_CONFIG_FILE, "utf8"))
    : CONFIGS[cfgName];
  if (!cfg) throw new Error(`Unknown FLOW_CONFIG '${cfgName}'. Known: ${Object.keys(CONFIGS).join(", ")}`);

  const browser = await puppeteer.connect({ browserURL: CDP, defaultViewport: VIEWPORT });
  const page = await browser.newPage();
  await page.setViewport(VIEWPORT);
  const consoleErrors = [];
  const failedRequests = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));
  page.on("requestfailed", (r) => failedRequests.push(`${r.url()} :: ${r.failure()?.errorText}`));

  const steps = {};
  const record = (name, ok, extra) => {
    steps[name] = { ok, ...extra };
    console.log(`[flow] ${name}: ${ok ? "PASS" : "FAIL"}${extra ? " " + JSON.stringify(extra) : ""}`);
  };

  // anti-throttle: the CFT launch flags (--disable-background-timer-throttling etc.) are the
  // browser's responsibility (long-running CFT instance), not this driver's.
  await page.goto(APP_URL, { waitUntil: "domcontentloaded", timeout: 30000 });
  await waitForCond(() => page.evaluate(() => !!document.querySelector("flt-semantics-host")), WAIT_MS, "flt-semantics-host (ensureSemantics on)");
  await waitSemanticsStable(page);
  await screenshotStep(page, OUT, "01-list-visible");

  // list-visible: seeded demo rows present, semantics host live.
  const listText = await page.evaluate(() => document.body.innerText || "");
  record("list-visible", /Sample item/.test(listText), { hasSeedRows: /Sample item/.test(listText) });

  // create-click: tap the FAB (tooltip "New <Entity>" — see screen.ts).
  await clickButton(page, `New ${cfg.entity}`);
  await waitSemanticsStable(page);
  const formFieldsCount = await page.evaluate(() => document.querySelectorAll("input, textarea").length);
  record("create-click", formFieldsCount > 0, { formFieldsCount });
  await screenshotStep(page, OUT, "02-create-form");

  // fill-form: type into the target field via real keystrokes; assert Submit isn't aria-disabled.
  await typeInto(page, cfg.field, cfg.createValue);
  await waitSemanticsStable(page);
  const typedOk = await page.evaluate(
    (label, v) => document.querySelector(`input[aria-label="${label}"]`)?.value === v,
    cfg.field, cfg.createValue,
  );
  record("fill-form", typedOk, { typedOk });
  await screenshotStep(page, OUT, "03-fill-form");

  // submit: tap Create, land on /<entity>/<id> (hash-routed — read location.href).
  await clickButton(page, "Create");
  await waitForCond(async () => {
    const href = await page.evaluate(() => location.href);
    return /#\/[a-z-]+\/[^/]+$/.test(href) ? href : null;
  }, WAIT_MS, "detail URL after submit");
  await waitSemanticsStable(page);
  const urlAfterSubmit = await page.evaluate(() => location.href);
  record("submit", true, { url: urlAfterSubmit });
  await screenshotStep(page, OUT, "04-submit");

  // detail-shows-created: the typed value appears on the detail screen.
  const detailText = await page.evaluate(() => document.body.innerText || "");
  record("detail-shows-created", detailText.includes(cfg.createValue), { found: detailText.includes(cfg.createValue) });
  await screenshotStep(page, OUT, "05-detail-created");

  // update: tap Edit, retype, Save; assert v2 shows on detail again.
  await clickButton(page, "Edit");
  await waitSemanticsStable(page);
  await typeInto(page, cfg.field, cfg.updateValue);
  await clickButton(page, "Save");
  await waitSemanticsStable(page);
  const updatedText = await page.evaluate(() => document.body.innerText || "");
  record("update", updatedText.includes(cfg.updateValue) && !updatedText.includes(cfg.createValue), { found: updatedText.includes(cfg.updateValue) });
  await screenshotStep(page, OUT, "06-update");

  // delete: tap Delete, land back on the list.
  await clickButton(page, "Delete");
  await waitSemanticsStable(page);
  await screenshotStep(page, OUT, "07-delete");

  // list-empty (of that row): back on the list, deleted row gone, seed rows still there.
  const finalText = await page.evaluate(() => document.body.innerText || "");
  record("list-empty", !finalText.includes(cfg.updateValue) && /Sample item/.test(finalText), {
    rowGone: !finalText.includes(cfg.updateValue),
    seedRowsPresent: /Sample item/.test(finalText),
  });
  await screenshotStep(page, OUT, "08-list-final");

  const netErrors = failedRequests.filter((u) => !/favicon/i.test(u));
  record("console-clean", consoleErrors.length === 0, { consoleErrors });
  record("net-clean", netErrors.length === 0, { netErrors });

  const passed = Object.values(steps).every((s) => s.ok);
  console.log(JSON.stringify({ app: APP_URL, config: cfgName, steps, passed }, null, 2));
  await page.close();
  process.exit(passed ? 0 : 1);
}

main().catch((e) => { console.error("flow driver failed:", e.stack || e.message); process.exit(1); });
