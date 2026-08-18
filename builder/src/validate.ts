import * as fs from "fs";
import * as path from "path";
import { execSync } from "child_process";
import { generateApp } from "./index";
import { oracleCoverage, oracleDirFor, loadOracle } from "./oracle";
import { isMoneyField, isPolicyRule, hasSplitGroups, splitParentEntities, splitGroupFor, listEntityName, tenantScopedEntities, hasAuth, hasAttachments, hasBudget, budgetOf, resolveBudget, auditedEntities, hasAudit, declaredExportScreens, resolveExport, exportableFields, hasLocale, hasOutbox, isSwiftUI, crudFormTargets } from "./operations";
import { fileName } from "./dart";
import { MAX_SHELL_DESTINATIONS, KNOWN_SHELL_ICONS, searchTargets, scrollTargets, actionsTargets, ActionSpec, statePlacementFor, visualFor, compositionFor } from "./composition";
import { screenPath } from "./routing";
import { DART_SDK_FLOOR } from "./toolchain";
import { unapprovedElements } from "./provenance";

/**
 * Validation pipeline — runs on generated output (determinism, headers, secrets, idioms, arch).
 * Exported as `validateOutput` so the CLI and the HTTP pipeline share it.
 */

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walk(p));
    else if (p.endsWith(".dart")) out.push(p);
  }
  return out;
}

// S2: the Swift analogue of walk() above — a sibling, not a parametrized version of it, so the
// Flutter walk stays byte-for-byte untouched (brief §2.6 Open/Closed).
function walkSwift(dir: string): string[] {
  const out: string[] = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out.push(...walkSwift(p));
    else if (p.endsWith(".swift")) out.push(p);
  }
  return out;
}

// Architecture linter: dependency-direction rules over the feature-first layout.
function archCheck(f: string, src: string): string | null {
  const rel = f.replace(/.*\/lib\//, "");
  // M2 (probe only, not yet applied — see report): every feature file lives under
  // features/<name>/<layer>/..., so slice(0,2) captures "features/<name>" (never containing
  // "/domain" etc) instead of "<name>/<layer>" — the check has been vacuous for every app, single-
  // or multi-feature, not just multi-feature as originally scoped.
  const layer = rel.split("/").slice(1, 3).join("/");
  const imports = [...src.matchAll(/import '([^']+)';/g)].map((m) => m[1] ?? "").filter(Boolean);
  if (layer.includes("/domain")) {
    const bad = imports.filter((i) =>
      i.startsWith("package:flutter/") || i.startsWith("package:dio") || i.startsWith("package:sqflite") ||
      i.includes("/data/") || i.includes("/presentation/") || i.includes("flutter_bloc") || i.includes("get_it"));
    if (bad.length) return `domain violation in ${rel}: ${bad.join(", ")}`;
  }
  if (layer.includes("/data")) {
    const bad = imports.filter((i) => i.includes("/presentation/"));
    if (bad.length) return `data→presentation in ${rel}: ${bad.join(", ")}`;
  }
  if (layer.includes("/presentation")) {
    const bad = imports.filter((i) => i.includes("/data/datasources") || i.includes("/data/repositories/"));
    if (bad.length) return `presentation→data-impl in ${rel}: ${bad.join(", ")}`;
    // Component registry (§8): screens must not hardcode tokens — consume registry components
    // instead. M2: `Colors\.` alone also matches "AppColors." (the app's OWN token class, e.g.
    // `AppColors.error`) — a false positive on exactly the pattern this check exists to require.
    // A negative lookbehind excludes any `Colors.`/`Color(` immediately preceded by a letter, so
    // `AppColors.x` passes while bare `Colors.x`/`Color(0x...)` still trips it.
    if (/(?<![A-Za-z])Colors\.|(?<![A-Za-z])Color\(0x|(?<![A-Za-z])Color\.fromRGBO|(?<![A-Za-z])const Color\(/.test(src)) {
      return `presentation bypasses registry (raw color literal) in ${rel}`;
    }
  }
  return null;
}

// D1 (DESIGN_OPTS §1 O1.1/O1.2/O1.3): the app root must render the token system, not a raw
// colorSchemeSeed literal. Proves: (a) main.dart wires theme: buildTheme(), darkTheme:
// buildThemeDark(), and a themeMode consistent with attributes.themeMode; (b) the old raw
// ThemeData(colorSchemeSeed:...) literal never returns; (c) when attributes.brandSeedColor is
// declared, core/theme.dart's AppColors.primary IS the declared seed (byte-for-byte) — the
// palette is derived from the seed, never a raw primary that ignores it; (d) a malformed declared
// seed is flagged (the generator deterministically falls back to the default brand teal).
function themeCheck(ir: any, files: string[]): string[] {
  const issues: string[] = [];
  const attrs = flattenedIr(ir).attributes ?? {};
  const mainFile = files.find((f) => f.endsWith("/lib/main.dart"));
  const themeFile = files.find((f) => f.endsWith("/core/theme.dart"));
  if (!mainFile) return issues; // [header]/[determinism] already report a missing app root

  const main = fs.readFileSync(mainFile, "utf8");

  if (!/theme:\s*buildTheme\(\),/.test(main)) {
    issues.push("[theme] lib/main.dart does not wire theme: buildTheme() — the token system is dead code in the running app");
  }
  if (/ThemeData\(\s*colorSchemeSeed:/.test(main)) {
    issues.push("[theme] lib/main.dart still emits a raw ThemeData(colorSchemeSeed:...) literal — must use buildTheme()");
  }

  const themeMode = attrs.themeMode ?? "light";
  if (!/darkTheme:\s*buildThemeDark\(\),/.test(main)) {
    issues.push("[theme] lib/main.dart missing darkTheme: buildThemeDark() — dark mode unreachable at the app root");
  }
  if (!main.includes(`themeMode: ThemeMode.${themeMode}`)) {
    issues.push(`[theme] lib/main.dart missing themeMode: ThemeMode.${themeMode} (attributes.themeMode=${attrs.themeMode ?? "empty — defaults light"})`);
  }

  const seed = attrs.brandSeedColor;
  if (seed) {
    const hex = seed.replace(/^#/, "").toUpperCase();
    if (!/^[0-9A-F]{6}$/.test(hex)) {
      issues.push(`[theme] attributes.brandSeedColor="${seed}" is not a valid #RRGGBB hex — the generator falls back to the default brand teal; the IR should be corrected`);
    } else if (themeFile) {
      const src = fs.readFileSync(themeFile, "utf8");
      if (!src.includes(`AppColors.primary = Color(0xFF${hex})`)) {
        issues.push(`[theme] attributes.brandSeedColor="${seed}" declared but core/theme.dart AppColors.primary is not the seed Color(0xFF${hex}) — raw palette not derived from the declared seed`);
      }
    }
  }
  return issues;
}

// D2#1 (SPIKE_S6_REPORT.md §14.1/§16): WCAG 2.1 contrast gate over emitted core/theme.dart
// tokens. Real relative-luminance + src-over alpha-composite math (never a heuristic) — no vision
// judge, per D1. Pairs are scoped to how each token is ACTUALLY painted in generated code today
// (grep-verified against generators/components.ts/screen.ts), not a blind cross-product:
//   - textPrimary/textSecondary: declared body-text tokens (textSecondary is consumed as
//     icon/caption text in screen.ts; textPrimary isn't consumed yet but is validated
//     pre-emptively like any other declared token) — checked opaque against every static
//     background theme.dart declares, 4.5:1 (WCAG body text).
//   - info/warning/danger/success: AppStatusDot paints these opaque against the ambient surface
//     (3.0:1, WCAG 1.4.11 non-text UI component) AND AppChip paints the SAME opaque tone as label
//     TEXT over its own `color.withValues(alpha: 0.12)` tint (components.ts:372,375) — composited
//     with real src-over math against AppColors.surface, 4.5:1 (it's text, however small).
//   - primary is declared but only ever consumed as a ColorScheme.fromSeed `seedColor:` (never
//     painted as a literal fg) — excluded; checking it as if it were opaque foreground would test a
//     render that never happens. Its actual on-screen role is M3's dynamically-derived tonal
//     palette, which (like textTheme's default colors) is out of reach without reimplementing
//     Material Color Utilities — genuinely undeterminable statically, not skipped for convenience.
// theme.dart is 100% generator-owned (no user region ever appears in it), so every finding here is
// `generated`-region, never advisory (§14.1 v3.4's inherited-region carve-out is vacuous for this
// file, by construction).
function parseArgbHex(hex: string): { r: number; g: number; b: number; a: number } {
  const clean = hex.replace(/^0x/i, "");
  return {
    a: parseInt(clean.slice(0, 2), 16) / 255,
    r: parseInt(clean.slice(2, 4), 16),
    g: parseInt(clean.slice(4, 6), 16),
    b: parseInt(clean.slice(6, 8), 16),
  };
}

function srcOver(fg: { r: number; g: number; b: number; a: number }, bg: { r: number; g: number; b: number }) {
  return {
    r: fg.a * fg.r + (1 - fg.a) * bg.r,
    g: fg.a * fg.g + (1 - fg.a) * bg.g,
    b: fg.a * fg.b + (1 - fg.a) * bg.b,
  };
}

function relativeLuminance(c: { r: number; g: number; b: number }): number {
  const lin = (v: number) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * lin(c.r) + 0.7152 * lin(c.g) + 0.0722 * lin(c.b);
}

function contrastRatio(l1: number, l2: number): number {
  const hi = Math.max(l1, l2);
  const lo = Math.min(l1, l2);
  return (hi + 0.05) / (lo + 0.05);
}

function contrastCheck(ir: any, files: string[]): string[] {
  const issues: string[] = [];
  const themeFile = files.find((f) => f.endsWith("/core/theme.dart"));
  if (!themeFile) return issues; // [header]/[determinism] already report a missing theme file

  const src = fs.readFileSync(themeFile, "utf8");
  const tokens = new Map<string, string>();
  for (const m of src.matchAll(/static const (\w+) = Color\((0x[0-9A-Fa-f]{8})\);/g)) {
    tokens.set(m[1] ?? "", m[2] ?? "");
  }
  if (tokens.size === 0 || !tokens.has("surface")) return issues; // theme.dart shape changed underneath this gate — nothing parseable

  const lightBlock = src.split("ThemeData buildThemeDark")[0] ?? "";
  const darkBlock = src.split("ThemeData buildThemeDark")[1] ?? "";
  const bgOf = (block: string, key: string): string | null => {
    const m = block.match(new RegExp(`${key}:\\s*const Color\\((0x[0-9A-Fa-f]{8})\\)`));
    return m ? (m[1] ?? null) : null;
  };

  const backgrounds: { label: string; hex: string }[] = [{ label: "AppColors.surface", hex: tokens.get("surface")! }];
  const scaffoldLight = bgOf(lightBlock, "scaffoldBackgroundColor");
  if (scaffoldLight) backgrounds.push({ label: "light scaffoldBackgroundColor", hex: scaffoldLight });
  const fillLight = bgOf(lightBlock, "fillColor");
  if (fillLight) backgrounds.push({ label: "light fillColor", hex: fillLight });
  const scaffoldDark = bgOf(darkBlock, "scaffoldBackgroundColor");
  if (scaffoldDark) backgrounds.push({ label: "dark scaffoldBackgroundColor", hex: scaffoldDark });
  const fillDark = bgOf(darkBlock, "fillColor");
  if (fillDark) backgrounds.push({ label: "dark fillColor", hex: fillDark });

  const opaqueAgainst = (tokenName: string, threshold: number, kind: string, backgroundsToUse: { label: string; hex: string }[]) => {
    const fgHex = tokens.get(tokenName);
    if (!fgHex) return;
    const fg = parseArgbHex(fgHex);
    for (const bg of backgroundsToUse) {
      const bgRgb = parseArgbHex(bg.hex);
      const ratio = contrastRatio(relativeLuminance(srcOver(fg, bgRgb)), relativeLuminance(bgRgb));
      if (ratio < threshold) {
        issues.push(`[contrast] AppColors.${tokenName} (${kind}) on ${bg.label} — ${ratio.toFixed(2)}:1 below WCAG ${threshold.toFixed(1)}:1 (fg=${fgHex} bg=${bg.hex})`);
      }
    }
  };

  for (const t of ["textPrimary", "textSecondary"]) opaqueAgainst(t, 4.5, "body text", backgrounds);
  for (const t of ["info", "warning", "danger", "success"]) opaqueAgainst(t, 3.0, "AppStatusDot (non-text UI component)", backgrounds);

  // AppChip (components.ts:368-375): the SAME opaque tone painted as label TEXT over its own
  // `color.withValues(alpha: 0.12)` tint — a real, present-day alpha usage, not a hypothetical one.
  const surfaceRgb = parseArgbHex(tokens.get("surface")!);
  for (const t of ["info", "warning", "danger", "success"]) {
    const hex = tokens.get(t);
    if (!hex) continue;
    const opaque = parseArgbHex(hex);
    const tint = { ...opaque, a: 0.12 };
    const chipBg = srcOver(tint, surfaceRgb);
    const ratio = contrastRatio(relativeLuminance(opaque), relativeLuminance(chipBg));
    if (ratio < 4.5) {
      issues.push(`[contrast] AppColors.${t} (AppChip label text) on its own 12%-tint over AppColors.surface — ${ratio.toFixed(2)}:1 below WCAG 4.5:1 (fg=${hex} tint-bg composited)`);
    }
  }

  return issues;
}

// S2 (§6.3): the Swift analogue of archCheck above, for the [swiftarch] gate — a sibling function,
// not a shared/parametrized one, so archCheck's Flutter behavior stays byte-for-byte untouched
// (§2.6 Open/Closed). V1 rule (requirements §6.3): a Domain-layer file must not import
// SwiftUI/UIKit. S2's skeleton has no Domain/ files at all (App.swift/HelloView.swift are the
// platform entry point and a Features/ view respectively), so this passes vacuously today — it
// exists now so S3+ (which will add real Domain/ files) can't silently regress it later.
function swiftArchCheck(f: string, src: string): string | null {
  const rel = f.replace(/.*\/ios\//, "");
  if (rel.includes("/Domain/") && /^\s*import\s+(SwiftUI|UIKit)\b/m.test(src)) {
    return `Domain violation in ${rel}: imports SwiftUI/UIKit`;
  }
  return null;
}

// Strategy fidelity (P3-C4): the plan.json `strategy` a state artifact claims must match
// the "sealed"-ness of the template the generator actually emitted — catches the class of
// bug where the scoring function selects sealed-events but the generator silently falls
// back to enum-status (plan.json would then describe code that was never generated).
function stateStrategyFidelity(outDir: string): string[] {
  const planPath = path.join(outDir, "plan.json");
  if (!fs.existsSync(planPath)) return [`[fidelity] plan.json missing in ${outDir}`];
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const mismatches: string[] = [];
  for (const entry of plan.entries ?? []) {
    if (entry.schema !== "state") continue;
    const filePath = path.join(outDir, entry.file);
    if (!fs.existsSync(filePath)) {
      mismatches.push(`[fidelity] ${entry.artifact}: declared file missing (${entry.file})`);
      continue;
    }
    const src = fs.readFileSync(filePath, "utf8");
    const m = src.match(/template=(\S+)/);
    const template = m?.[1] ?? "<none>";
    const claimsSealed = entry.strategy === "sealed-events";
    const emitsSealed = /sealed/i.test(template);
    if (claimsSealed !== emitsSealed) {
      mismatches.push(`[fidelity] ${entry.artifact}: plan strategy='${entry.strategy}' but emitted template='${template}'`);
    }
  }
  return mismatches;
}

// P7-L1 ("Money never uses double"): every entity field declared `semanticType: "Money"` must
// never surface as a raw `double` field declaration anywhere in the generated output — that would
// mean some generator fell through to the generic double path instead of special-casing Money
// (silently reintroducing floating-point rounding error into a money amount).
function moneyCheck(ir: any, files: string[]): string[] {
  const moneyFieldNames = new Set<string>();
  for (const e of ir.entities ?? []) {
    for (const f of e.fields ?? []) {
      if (isMoneyField(f)) moneyFieldNames.add(f.name);
    }
  }
  if (!moneyFieldNames.size) return [];
  const issues: string[] = [];
  for (const name of moneyFieldNames) {
    const re = new RegExp(`\\bdouble\\??\\s+${name}\\b`);
    for (const f of files) {
      const src = fs.readFileSync(f, "utf8");
      if (re.test(src)) issues.push(`[money] field '${name}' emitted as double in ${f}`);
    }
  }
  return issues;
}

// G2 ("real date picker, not free-typed text"): a DateTime field's editable input (CRUD form or
// wizard step) must drive `showDatePicker`. The bug signature is precise and doesn't need to know
// which field/file is which: a bare TextField/TextFormField date input is the only place the
// generator ever emits `hintText: 'YYYY-MM-DD'` (list/detail's read-only display renders a Text,
// never a hinted input) — so that hint surviving in a file with no `showDatePicker` alongside it
// means some generator fell back to free-typed text instead of the picker.
function datepickerCheck(ir: any, files: string[]): string[] {
  const hasDateField = (ir.entities ?? []).some((e: any) => (e.fields ?? []).some((f: any) => f.type === "DateTime"));
  if (!hasDateField) return [];
  const issues: string[] = [];
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    if (src.includes("hintText: 'YYYY-MM-DD'") && !src.includes("showDatePicker")) {
      issues.push(`[datepicker] bare TextField date input (no showDatePicker) in ${f}`);
    }
  }
  return issues;
}

// L2: a severity'd rule (see operations.ts's isPolicyRule) drives generated policy-verdict UI —
// stricter than the general [oracle] gate (which only requires SOME oracle coverage for every
// rule): a policy rule additionally needs a valid severity value and a non-empty plain-language
// message (an empty message would mean the whole point of a verdict — "employee sees plain-
// language reasons before submit" — silently fails at the UI layer, not caught by [oracle]).
const VALID_SEVERITIES = ["autoApprove", "warn", "requireJustification", "block"];
function verdictCheck(ir: any, oracleDir: string): string[] {
  const issues: string[] = [];
  for (const rule of ir.businessRules ?? []) {
    if (!isPolicyRule(rule)) continue;
    if (!VALID_SEVERITIES.includes(rule.severity)) {
      issues.push(`[verdict] rule '${rule.name}': invalid severity '${rule.severity}'`);
    }
    if (!rule.message || !String(rule.message).trim()) {
      issues.push(`[verdict] rule '${rule.name}': severity '${rule.severity}' requires a non-empty message`);
    }
    const oracle = loadOracle(rule.name, oracleDir);
    if (!oracle || !oracle.cases || oracle.cases.length === 0) {
      issues.push(`[verdict] rule '${rule.name}': severity'd rule missing/zero-case oracle — unverifiable`);
    }
  }
  return issues;
}

// MF4: validateSplit isn't a RuleModel (operations.ts's splitGroupFor doc comment covers why), so
// it can't reuse oracleCoverage/verdictCheck's per-rule-name iteration — this checks the ONE
// shared oracle (Split.oracle.json) that every split group's UI/domain tests compile from, plus
// that each split group actually has a category field to render (without one the "Split" section
// and detail breakdown would silently fall back to a placeholder label — see splitGroupFor).
function splitCheck(ir: any, oracleDir: string): string[] {
  const issues: string[] = [];
  if (!hasSplitGroups(ir)) return issues;
  const oracle = loadOracle("Split", oracleDir);
  if (!oracle || !oracle.cases || oracle.cases.length === 0) {
    issues.push(`[split] app declares a split group but is missing/has zero-case Split.oracle.json — unverifiable`);
  }
  for (const parent of splitParentEntities(ir)) {
    const group = splitGroupFor(parent, ir);
    if (group && !group.categoryField) {
      issues.push(`[split] entity '${group.child}' (split child of '${parent}') has no String category field — split UI cannot render a category label`);
    }
  }
  return issues;
}

// MF2 trust boundary, generated-side: any entity whose IR declares a `tenantId` field and a
// repository must have that repository's generated impl enforcing tenant isolation — the scoped
// snapshot marker set below (read filter + write stamp + session tenant + the list-query tail)
// NEVER appears in unscoped repos (repository_impl.ts gates every one of them), so any miss means
// a code path fell through to the unscoped branch and would leak one tenant's rows to another.
// Unlike the whole-app linters above, this is per-repo-file so a single unscoped impl can't hide
// behind another scoped one.
// M3 (LEFTOVER_NOTES.md, MF1): symbols.ts's buildSymbols is called once per feature and the
// results merged with Map.set — a type name (entity/enum/valueObject/query/wrapper/repository/
// state/screen/stateMachine/form) declared by TWO different features silently collides:
// whichever feature is processed last simply overwrites the first's registration in the shared
// table, so the FIRST feature's own generated code (which imports that name expecting its own
// file) resolves to the wrong path. No-op for a single-feature IR (`ir.features` isn't an array).
const SYMBOL_NAME_KEYS = ["entities", "enums", "valueObjects", "queries", "wrappers", "repositories", "states", "screens", "stateMachines", "forms"];
function symbolCollisionCheck(ir: any): string[] {
  if (!Array.isArray(ir.features)) return [];
  const owner = new Map<string, string>();
  const issues: string[] = [];
  for (const f of ir.features) {
    for (const key of SYMBOL_NAME_KEYS) {
      for (const item of (f as any)[key] ?? []) {
        const prev = owner.get(item.name);
        if (prev && prev !== f.name) {
          issues.push(`[symbols] '${item.name}' declared in both feature '${prev}' and '${f.name}' — cross-feature symbol collision, last-registered silently wins`);
        } else if (!prev) {
          owner.set(item.name, f.name);
        }
      }
    }
  }
  return issues;
}

// P1 (INTERFACE_PATTERN_CONTRACT.md §3, §9): global bottom-nav shell. Multi-feature-guarded the
// same way symbolCollisionCheck above is (`!Array.isArray(ir.features)` -> vacuous pass for a
// single-feature IR) and additive (a multi-feature app composition.ts decided NO shell for, i.e.
// exactly 1 feature under an AppModel, is unaffected too). Reads plan.json's `patterns.shell` —
// the composition layer's own recorded decision (contract §2.6) — rather than re-deriving
// order/title/icon from source, mirroring [fidelity]'s "prove the plan's decision matches the
// emitted artifact" posture; the `// feature: <id>` markers embedded in app_shell.dart's own
// NavigationDestination entries are the cross-check that what plan.json claims is actually what
// got emitted, not just what was decided. `StatefulShellRoute.indexedStack` lives in router.dart
// (RouteGenerator); `NavigationBar`/the destination markers live in app_shell.dart (AppShellGenerator)
// — two different generated files, checked against each one they actually appear in.
function shellCheck(ir: any, outDir: string, files: string[]): string[] {
  if (!Array.isArray(ir.features)) return [];
  const issues: string[] = [];
  const routerFile = files.find((f) => f.endsWith("/core/router.dart"));
  const shellFile = files.find((f) => f.endsWith("/core/app_shell.dart"));
  const featureCount = ir.features.length;

  // <=1 feature: composition.ts's shellFor returns null — no shell should exist at all.
  if (featureCount <= 1) {
    const routerSrc = routerFile ? fs.readFileSync(routerFile, "utf8") : "";
    if (shellFile || routerSrc.includes("StatefulShellRoute.indexedStack")) {
      issues.push(`[shell] app declares ${featureCount} feature(s) but a shell was emitted (core/app_shell.dart and/or StatefulShellRoute.indexedStack) — a shell must only exist when features.length > 1`);
    }
    return issues;
  }

  // Contract §3.2: the >5 case should already have thrown a generation error before any output
  // existed (composition.ts's shellFor) — this re-assertion is a safety net on the artifact, not
  // the primary enforcement point, so it fires only if something upstream regressed.
  if (featureCount > MAX_SHELL_DESTINATIONS) {
    issues.push(`[shell] ${featureCount} features exceeds the V1 shell's ${MAX_SHELL_DESTINATIONS}-destination capability — generation should have rejected this IR before producing output`);
    return issues;
  }

  if (!routerFile) {
    issues.push(`[shell] multi-feature app (${featureCount} features) has no lib/core/router.dart to check`);
    return issues;
  }
  const routerSrc = fs.readFileSync(routerFile, "utf8");
  if (!routerSrc.includes("StatefulShellRoute.indexedStack")) {
    issues.push(`[shell] multi-feature app (${featureCount} features) missing StatefulShellRoute.indexedStack in router.dart`);
  }
  if (!shellFile) {
    issues.push(`[shell] multi-feature app expects a shell but generated output has no core/app_shell.dart (AppShell)`);
    return issues;
  }
  const shellSrc = fs.readFileSync(shellFile, "utf8");
  if (!shellSrc.includes("NavigationBar(")) {
    issues.push(`[shell] core/app_shell.dart exists but has no NavigationBar`);
  }

  const planPath = path.join(outDir, "plan.json");
  if (!fs.existsSync(planPath)) {
    issues.push(`[shell] plan.json missing in ${outDir} — cannot verify shell destination order`);
    return issues;
  }
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const destinations = plan.patterns?.shell?.destinations;
  if (!Array.isArray(destinations)) {
    issues.push(`[shell] plan.json missing patterns.shell.destinations for a multi-feature app`);
    return issues;
  }

  // features[] order ⇒ shell destination order (contract §3.1) — byte-order compare against the IR.
  const expectedIds = ir.features.map((f: any) => f.name);
  const actualIds = destinations.map((d: any) => d.featureId);
  if (JSON.stringify(expectedIds) !== JSON.stringify(actualIds)) {
    issues.push(`[shell] destination order [${actualIds.join(", ")}] does not match features[] order [${expectedIds.join(", ")}]`);
  }
  if (destinations.length > MAX_SHELL_DESTINATIONS) {
    issues.push(`[shell] plan.json declares ${destinations.length} destinations, exceeding the V1 shell's ${MAX_SHELL_DESTINATIONS}-destination capability`);
  }
  for (const d of destinations) {
    if (!d.title || !String(d.title).trim()) {
      issues.push(`[shell] destination '${d.featureId}' has no title`);
    }
    if (!d.icon || !KNOWN_SHELL_ICONS.has(d.icon)) {
      issues.push(`[shell] destination '${d.featureId}' has an unrecognized icon '${d.icon}' — not in the fixed stem map`);
    }
    if (!shellSrc.includes(`// feature: ${d.featureId}`)) {
      issues.push(`[shell] destination '${d.featureId}' declared in plan.json but not found in app_shell.dart's emitted NavigationDestination markers`);
    }
  }
  return issues;
}

// P2 (INTERFACE_PATTERN_CONTRACT.md §4, grill C4/C5/C6): per-list search. Unlike [shell], this
// applies to single- AND multi-feature apps alike — flattenedIr(ir) already normalizes both
// shapes (same helper [tenant]/[audit]/[symbols] etc. use above), no `ir.features` guard needed.
// Re-asserts the selector by calling the SAME `searchTargets` composition.ts itself uses (not a
// re-implementation — a second, drifting copy of the predicate would defeat the point of a
// dedicated gate), then cross-checks plan.json's recorded decision and the generated screen
// files against it: right screens have SearchBar, no others do.
function searchCheck(ir: any, outDir: string, files: string[]): string[] {
  const issues: string[] = [];
  const flat = flattenedIr(ir);
  const screens: any[] = flat.screens ?? [];

  // Re-derive fresh from the raw IR — the authoritative "what SHOULD be searchable" answer.
  const expected = searchTargets(flat as any); // Map<screenName, SearchSpec>
  const expectedByPath = new Map<string, { field: string; mode: string }>();
  for (const [screenName, spec] of expected) {
    const screen = screens.find((s) => s.name === screenName);
    if (screen) expectedByPath.set(screenPath(screens, screen), spec);
  }

  const planPath = path.join(outDir, "plan.json");
  if (!fs.existsSync(planPath)) {
    issues.push(`[search] plan.json missing in ${outDir} — cannot verify search decisions`);
    return issues;
  }
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const recorded: Record<string, any> = plan.patterns?.search ?? {};

  // plan.json's recorded decision must match the freshly re-derived one exactly (same paths,
  // same field/mode per path) — a mismatch means the plan drifted from what the selector would
  // decide today (stale plan, or a hand-edit), same "prove the plan matches reality" posture
  // [fidelity] takes for per-state strategy.
  const expectedPaths = new Set(expectedByPath.keys());
  const recordedPaths = new Set(Object.keys(recorded));
  for (const p of expectedPaths) {
    if (!recordedPaths.has(p)) {
      issues.push(`[search] '${p}' should be searchable (list screen + repo list + declared primaryDisplayField) but plan.json's patterns.search has no entry for it`);
      continue;
    }
    const exp = expectedByPath.get(p)!;
    const rec = recorded[p];
    if (rec.field !== exp.field || rec.mode !== exp.mode || rec.enabled !== true) {
      issues.push(`[search] '${p}' plan.json entry {field:'${rec.field}', mode:'${rec.mode}', enabled:${rec.enabled}} does not match the re-derived decision {field:'${exp.field}', mode:'${exp.mode}', enabled:true}`);
    }
  }
  for (const p of recordedPaths) {
    if (!expectedPaths.has(p)) {
      issues.push(`[search] plan.json declares search for '${p}' but re-deriving the selector against the current IR no longer resolves it — stale plan entry`);
    }
  }

  // Cross-check the generated output: only screens plan.json marked searchable may render a
  // SearchBar, and every one of them actually does.
  for (const screen of screens) {
    if (screen.type !== "list") continue;
    const entry = (plan.entries ?? []).find((e: any) => e.schema === "screen" && (e.artifact === `screen:${screen.name}` || e.artifact.endsWith(`:screen:${screen.name}`)));
    if (!entry) continue; // a screen plan.json itself doesn't know about is out of scope for this gate
    const filePath = path.join(outDir, entry.file);
    if (!fs.existsSync(filePath)) continue; // reported by other gates already
    const src = fs.readFileSync(filePath, "utf8");
    const p = screenPath(screens, screen);
    const shouldHaveSearch = recordedPaths.has(p);
    const hasSearchBar = src.includes("SearchBar(");
    if (shouldHaveSearch && !hasSearchBar) {
      issues.push(`[search] '${p}' (${screen.name}) is marked searchable in plan.json but its generated screen has no SearchBar`);
    }
    if (!shouldHaveSearch && hasSearchBar) {
      issues.push(`[search] '${p}' (${screen.name}) has no search entry in plan.json but its generated screen renders a SearchBar anyway`);
    }
  }
  return issues;
}

// P3 (INTERFACE_PATTERN_CONTRACT.md §5): per-screen on-scroll AppBar tint. Same centralized-
// decision posture as [search]: re-asserts the selector by calling the SAME `scrollTargets`
// composition.ts itself uses (not a re-implementation), then cross-checks plan.json's recorded
// patterns.scroll against the generated screen files — but, unlike [search], checks EVERY screen
// (not just list screens): the declared contract rule (scroll.enabled = screen.kind ∈ {list,
// detail}) means a list/detail screen must render the scroll listener AND every other screen
// (wizard/form) must NOT — the byte-identical proof for the null-selector case.
export function scrollCheck(ir: any, outDir: string, files: string[]): string[] {
  const issues: string[] = [];
  const flat = flattenedIr(ir);
  const screens: any[] = flat.screens ?? [];

  // Re-derive fresh from the raw IR — the authoritative "what SHOULD scroll" answer.
  const expected = scrollTargets(flat as any); // Map<screenName, ScrollSpec>
  const expectedByPath = new Set<string>();
  for (const [screenName] of expected) {
    const screen = screens.find((s) => s.name === screenName);
    if (screen) expectedByPath.add(screenPath(screens, screen));
  }

  const planPath = path.join(outDir, "plan.json");
  if (!fs.existsSync(planPath)) {
    issues.push(`[scroll] plan.json missing in ${outDir} — cannot verify scroll decisions`);
    return issues;
  }
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const recorded: Record<string, any> = plan.patterns?.scroll ?? {};

  // plan.json's recorded decision must match the freshly re-derived one exactly (same paths) —
  // a mismatch means the plan drifted from what the selector would decide today.
  const recordedPaths = new Set(Object.keys(recorded));
  for (const p of expectedByPath) {
    if (!recordedPaths.has(p)) {
      issues.push(`[scroll] '${p}' should scroll (declared contract rule: screen.kind ∈ {list, detail}) but plan.json's patterns.scroll has no entry for it`);
      continue;
    }
    const rec = recorded[p];
    if (rec.enabled !== true) {
      issues.push(`[scroll] '${p}' plan.json entry {enabled:${rec.enabled}} does not match the re-derived decision {enabled:true}`);
    }
  }
  for (const p of recordedPaths) {
    if (!expectedByPath.has(p)) {
      issues.push(`[scroll] plan.json declares scroll for '${p}' but re-deriving the selector against the current IR no longer resolves it — stale plan entry`);
    }
  }

  // Cross-check the generated output: list/detail screens (the rule's positive set) must render
  // the scroll listener; every other screen (wizard/form — the rule's null set) must NOT.
  const hasListener = (src: string) => src.includes("NotificationListener<ScrollNotification>");
  for (const screen of screens) {
    const entry = (plan.entries ?? []).find((e: any) => e.schema === "screen" && (e.artifact === `screen:${screen.name}` || e.artifact.endsWith(`:screen:${screen.name}`)));
    if (!entry) continue; // a screen plan.json itself doesn't know about is out of scope for this gate
    const filePath = path.join(outDir, entry.file);
    if (!fs.existsSync(filePath)) continue; // reported by other gates already
    const src = fs.readFileSync(filePath, "utf8");
    const p = screenPath(screens, screen);
    const shouldScroll = expectedByPath.has(p);
    const hasIt = hasListener(src);
    if (shouldScroll && !hasIt) {
      issues.push(`[scroll] '${p}' (${screen.name}) is in patterns.scroll but its generated screen has no NotificationListener<ScrollNotification>`);
    }
    if (!shouldScroll && hasIt) {
      issues.push(`[scroll] '${p}' (${screen.name}) has no scroll entry in plan.json but its generated screen renders a NotificationListener anyway`);
    }
  }
  return issues;
}

// P4 (INTERFACE_PATTERN_CONTRACT.md §6, SPIKE_PLAN §P4): per-screen capability-driven actions.
// Same centralized-decision posture as [search]/[scroll]: re-asserts the selector by calling the
// SAME `actionsTargets` composition.ts itself uses (not a re-implementation), then:
//   (a) cross-checks plan.json's recorded patterns.actions against a fresh re-derivation, and
//   (b) scans EVERY generated screen for output/decision agreement (S-P4 acceptance criteria 3-8):
//       - a screen with a decided action set renders exactly it (positive set present, null set
//         absent — byte-identical for capability-free screens),
//       - Delete is ALWAYS confirmed (confirm dialog) when actionsFor decided confirm:true,
//       - no Save "extended FAB" is generated anywhere (save is a semantic kind only),
//       - v1 closed vocabulary: only the known kinds have a plan entry (invariant 8).
export function actionsCheck(ir: any, outDir: string, files: string[]): string[] {
  const issues: string[] = [];
  const flat = flattenedIr(ir);
  const screens: any[] = flat.screens ?? [];

  // Re-derive fresh from the raw IR — the authoritative "what SHOULD be rendered" answer.
  const expected = actionsTargets(flat as any); // Map<screenName, ActionSpec[]>

  const planPath = path.join(outDir, "plan.json");
  if (!fs.existsSync(planPath)) {
    issues.push(`[actions] plan.json missing in ${outDir} — cannot verify action decisions`);
    return issues;
  }
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const recorded: Record<string, any> = plan.patterns?.actions ?? {};

  // Build path→kinds maps for a clean set-diff that ignores ordering.
  const recordedKindsByPath: Record<string, Set<string>> = {};
  for (const [p, specs] of Object.entries(recorded)) {
    recordedKindsByPath[p] = new Set((specs as any[]).map((s) => s.kind));
  }
  const expectedKindsByPath: Record<string, Set<string>> = {};
  for (const [screenName, specs] of expected) {
    const screen = screens.find((s) => s.name === screenName);
    if (!screen) continue;
    const p = screenPath(screens, screen);
    expectedKindsByPath[p] = new Set(specs.map((a) => a.kind));
  }

  // (a) plan.json drift vs fresh re-derivation (invariants 9: plan is derived, not authoritative).
  for (const [p, kinds] of Object.entries(expectedKindsByPath)) {
    const rec = recordedKindsByPath[p];
    if (!rec) {
      issues.push(`[actions] '${p}' should have actions (${[...kinds].join(", ")}) but plan.json's patterns.actions has no entry for it`);
      continue;
    }
    const missing = [...kinds].filter((k) => !rec.has(k));
    if (missing.length) issues.push(`[actions] '${p}' plan.json is missing decided action kind(s): ${missing.join(", ")}`);
    const unexpected = [...rec].filter((k) => !kinds.has(k));
    if (unexpected.length) issues.push(`[actions] '${p}' plan.json declares unexpected action kind(s): ${unexpected.join(", ")} (closed vocabulary: edit|export|delete|audit|save)`);
  }
  for (const [p, rec] of Object.entries(recordedKindsByPath)) {
    if (!expectedKindsByPath[p]) {
      issues.push(`[actions] plan.json declares actions for '${p}' but re-deriving the selector against the current IR no longer resolves them — stale plan entry`);
    }
    // Closed vocabulary (invariant 8): every plan action kind must be a known v1 kind.
    for (const k of rec) {
      if (!["edit", "export", "delete", "audit", "save"].includes(k)) {
        issues.push(`[actions] plan.json declares action kind '${k}' for '${p}' — not in the v1 closed vocabulary (edit|export|delete|audit|save)`);
      }
    }
  }

  // (b) output/decision agreement per screen (invariants 3-7).
  for (const screen of screens) {
    const entry = (plan.entries ?? []).find((e: any) => e.schema === "screen" && (e.artifact === `screen:${screen.name}` || e.artifact.endsWith(`:screen:${screen.name}`)));
    if (!entry) continue;
    const filePath = path.join(outDir, entry.file);
    if (!fs.existsSync(filePath)) continue; // reported by other gates already
    const src = fs.readFileSync(filePath, "utf8");
    const p = screenPath(screens, screen);
    const specs = expectedKindsByPath[p] ?? new Set<string>();

    // Positive set: each decided non-export action must render in the generated screen. (Export is
    // bloc-only this iteration — the [export] gate + exportButtons guard handle it; see S-P4.)
    for (const kind of specs) {
      if (kind === "export") continue;
      if (kind === "edit" && !src.includes("Icons.edit")) {
        issues.push(`[actions] '${p}' (${screen.name}) decides an edit action but the generated screen renders no edit button`);
      }
      if (kind === "delete" && !src.includes("Delete")) {
        issues.push(`[actions] '${p}' (${screen.name}) decides a delete action but the generated screen renders no delete action`);
      }
      if (kind === "audit" && !src.includes("Icons.history") && !src.includes("/audit-log")) {
        issues.push(`[actions] '${p}' (${screen.name}) decides an audit action but the generated screen has no audit entry point`);
      }
    }

    // Invariant 4: a Delete action on a detail screen MUST be confirm-guarded (someone picked by
    // actionsFor decided confirm:true). A bare `onPressed: () async { await ...delete` without the
    // showDialog wrapper is a (rejected) unconfirmed-delete regression.
    if (specs.has("delete")) {
      if (!src.includes("showDialog<bool>") || !src.includes("confirmed != true")) {
        issues.push(`[actions] '${p}' (${screen.name}) delete action is NOT confirm-guarded — Cancel must leave the entity untouched`);
      }
    }
  }

  // Invariant 6: `save` is a semantic kind only — NO extended FAB may appear on any form screen.
  // Scan the form screens (crudFormTargets) for a FloatingActionButton (Save-FAB appearing fails).
  // `files` are absolute paths under outDir/lib (walk()), so read them directly.
  for (const [entityName] of crudFormTargets(flat as any)) {
    const formFileName = `${entityName.toLowerCase()}_form_screen.dart`;
    const formFiles = files.filter((f) => f.endsWith(formFileName));
    for (const f of formFiles) {
      const src = fs.readFileSync(f, "utf8");
      if (src.includes("floatingActionButton") || src.includes("FloatingActionButton.extended")) {
        issues.push(`[actions] ${path.relative(outDir, f)} renders a floatingActionButton — save must keep its single PrimaryButton (no FAB, invariant 6)`);
      }
    }
  }

  return issues;
}

// P5/D2 Slice 4 (SPIKE_P5_D2_REPORT.md §13.6/§14.3, the FINAL P5/D2 slice) — the `[states]` gate.
// Same centralized-decision posture as [search]/[scroll]/[actions]: re-asserts the selector by
// calling the SAME `statePlacementFor` composition.ts itself uses (never a parallel
// re-implementation — §15's REJECTED "blind all-three validator trap" is exactly a validator that
// second-guesses the triad independently instead of re-deriving the one true selector), for EVERY
// screen, then:
//   (a) cross-checks plan.json's recorded patterns.states against a fresh re-derivation — INCLUDING
//       the null case: a screen whose re-derived spec is null (today: wizard, whose flow-status
//       field is `wizardStatus` not `status`) must have NO plan entry either;
//   (b) scans EVERY generated screen for output/decision agreement, per the APPLICABLE contract for
//       that screen (§9's failure-mode table) — not "does every member of the triad render":
//         loading/error/empty/emptyCta/refresh — applicable ⇔ the corresponding spec field, exactly
//           as composition.ts decided (empty/emptyCta/refresh are already screen.type === "list"
//           -scoped at the composition.ts level, via the `empty` field's own definition);
//         retry — applicable ⇔ spec.retry AND screen.type === "list". composition.ts's `retry`
//           field mirrors `error` at the STATE-MODEL level on purpose (statePlacementFor's own doc
//           comment: retry/refresh trace to error/empty because load() is unconditional) — so a
//           detail screen sharing a list's cubit re-derives retry:true too. But Slice 3's screen.ts
//           deliberately withholds the RENDERED retry button there (SPIKE_P5_D2_REPORT.md §16: "the
//           owner's decision scopes the rendered button to lists only, detail-screen retry is a
//           follow-up, not this slice") — the gate must match the REAL, intended render contract,
//           not the raw spec alone, or it would FAIL every detail screen sharing a list's cubit
//           (which is the normal, correct case, not a bug).
export function statesCheck(ir: any, outDir: string, files: string[]): string[] {
  const issues: string[] = [];
  const flat = flattenedIr(ir);
  const screens: any[] = flat.screens ?? [];

  const planPath = path.join(outDir, "plan.json");
  if (!fs.existsSync(planPath)) {
    issues.push(`[states] plan.json missing in ${outDir} — cannot verify state placement decisions`);
    return issues;
  }
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const recorded: Record<string, any> = plan.patterns?.states ?? {};
  const recordedPaths = new Set(Object.keys(recorded));
  const expectedPaths = new Set<string>();

  const specEqual = (a: any, b: any) =>
    !!a && !!b && a.flowField === b.flowField && a.loading === b.loading && a.error === b.error &&
    a.empty === b.empty && a.emptyCta === b.emptyCta && a.retry === b.retry && a.refresh === b.refresh;

  // (a) plan.json vs fresh re-derivation — same "stale plan entry" posture as [search]/[scroll].
  for (const screen of screens) {
    const spec = statePlacementFor(screen, flat);
    const p = screenPath(screens, screen);
    if (spec) {
      expectedPaths.add(p);
      if (!recordedPaths.has(p)) {
        issues.push(`[states] '${p}' should declare state placement (state model has an applicable triad member) but plan.json's patterns.states has no entry for it`);
      } else if (!specEqual(spec, recorded[p])) {
        issues.push(`[states] '${p}' plan.json entry ${JSON.stringify(recorded[p])} does not match the re-derived decision ${JSON.stringify(spec)}`);
      }
    } else if (recordedPaths.has(p)) {
      issues.push(`[states] '${p}' has a plan.json patterns.states entry but re-deriving statePlacementFor against the current IR returns null (e.g. a wizard) — stale plan entry`);
    }
  }
  for (const p of recordedPaths) {
    if (!expectedPaths.has(p)) {
      issues.push(`[states] plan.json declares state placement for '${p}' but re-deriving the selector against the current IR no longer resolves it — stale plan entry`);
    }
  }

  // (b) generated-output markers vs the APPLICABLE contract (doc comment above) — each member
  // independently, both directions (decided-but-absent AND rendered-but-not-decided). A fixed
  // tuple list (not a Record keyed by member name) so TS's noUncheckedIndexedAccess can't turn a
  // lookup into a possibly-undefined marker function.
  for (const screen of screens) {
    const entry = (plan.entries ?? []).find((e: any) => e.schema === "screen" && (e.artifact === `screen:${screen.name}` || e.artifact.endsWith(`:screen:${screen.name}`)));
    if (!entry) continue; // a screen plan.json itself doesn't know about is out of scope for this gate
    const filePath = path.join(outDir, entry.file);
    if (!fs.existsSync(filePath)) continue; // reported by other gates already
    const src = fs.readFileSync(filePath, "utf8");
    const p = screenPath(screens, screen);
    const spec = statePlacementFor(screen, flat);
    const members: Array<[string, boolean, boolean]> = [
      ["loading", !!spec?.loading, src.includes("LoadingState()")],
      ["error", !!spec?.error, src.includes("ErrorState(message:")],
      // §16 "lists only" — see doc comment above: retry's applicability additionally requires
      // screen.type === "list", unlike the raw spec field (which mirrors `error` state-model-wide).
      ["retry", !!spec?.retry && screen.type === "list", src.includes("onRetry:")],
      ["empty", !!spec?.empty, src.includes("items.isEmpty")],
      ["emptyCta", !!spec?.emptyCta, src.includes("action: OutlinedButton(")],
      ["refresh", !!spec?.refresh, src.includes("RefreshIndicator(")],
    ];
    for (const [member, should, has] of members) {
      if (should && !has) {
        issues.push(`[states] '${p}' (${screen.name}) decided ${member} but the generated screen has no ${member} marker`);
      }
      if (!should && has) {
        issues.push(`[states] '${p}' (${screen.name}) has no ${member} entry in the decided placement but the generated screen renders one anyway`);
      }
    }
  }
  return issues;
}

// S1 (SPIKE_S1_REPORT.md §14.5) — the `[visualIntent]` gate. Same centralized-decision posture as
// [search]/[scroll]/[actions]/[states]: re-derives `visualFor` fresh for every screen (never a
// parallel re-implementation), then:
//   (a) cross-checks plan.json's recorded patterns.visual against the fresh re-derivation —
//       INCLUDING the null case: a screen with no visualStyle sub-field set must have NO plan
//       entry either;
//   (b) scans every generated screen whose archetype/IR could carry a marker (hero-gap token,
//       AppListCard radius token) — decided-but-absent AND present-but-undecided both FAIL;
//   (c) reuses provenance.ts's unapprovedElements() (D4: one source of truth, never forked) so an
//       unattested nested visualStyle value blocks this gate too, independent of index.ts's own
//       generation-time throw — the negative control (SPIKE_S1_REPORT.md §14.7: inject
//       visualStyle.hierarchy.requiresApproval:true post-approve → refused);
//   (d) v1 closed-enum check: a raw IR declaring visualStyle.imagery/emphasis fails — types.ts's
//       VisualStyleModel has no compile-time slot for either (D2/D3: imagery→S3, emphasis→S2), but
//       a hand- or LLM-authored IR is untyped JSON at runtime and could still carry the key;
//   (e) raw-literal guard: every `radius:` argument this screen emits must be an AppRadius.* token
//       reference, never a bare number — proves the mapping never regresses into IR-side numbers
//       (the one rule that cannot break — visualStyle only ever feeds the scoring/token layer).
export function visualIntentCheck(ir: any, outDir: string, files: string[]): string[] {
  const issues: string[] = [];
  const flat = flattenedIr(ir);
  const screens: any[] = flat.screens ?? [];

  // (c) reuse the single provenance source of truth — filter to visualStyle-scoped entries only
  // (unapprovedElements also reports non-visualStyle unapproved elements, out of this gate's scope).
  for (const u of unapprovedElements(flat)) {
    if (u.includes(".visualStyle.")) issues.push(`[visualIntent] unapproved: ${u} — generation must refuse until human-attested`);
  }

  // (d) v1 closed enum — imagery/emphasis are S3/S2 fields, never admitted now (D2/D3).
  for (const screen of screens) {
    const vs = screen.visualStyle;
    if (vs && typeof vs === "object" && (("imagery" in vs) || ("emphasis" in vs))) {
      const bad = "imagery" in vs ? "imagery" : "emphasis";
      issues.push(`[visualIntent] screen '${screen.name}' declares visualStyle.${bad} — not part of the v1 closed enum (D2/D3: imagery→S3, emphasis→S2)`);
    }
  }

  const planPath = path.join(outDir, "plan.json");
  if (!fs.existsSync(planPath)) {
    issues.push(`[visualIntent] plan.json missing in ${outDir} — cannot verify visual-intent decisions`);
    return issues;
  }
  const plan = JSON.parse(fs.readFileSync(planPath, "utf8"));
  const recorded: Record<string, any> = plan.patterns?.visual ?? {};
  const recordedPaths = new Set(Object.keys(recorded));
  const expectedPaths = new Set<string>();

  const specEqual = (a: any, b: any) =>
    !!a && !!b && a.heroScale === b.heroScale && a.baseSpacing === b.baseSpacing && a.surfaceBias === b.surfaceBias &&
    !!a.radiusScale && !!b.radiusScale && a.radiusScale.control === b.radiusScale.control &&
    a.radiusScale.surface === b.radiusScale.surface && a.radiusScale.container === b.radiusScale.container;

  // (a) plan.json vs fresh re-derivation — same "stale plan entry" posture as [states].
  for (const screen of screens) {
    const spec = visualFor(screen, flat);
    const p = screenPath(screens, screen);
    if (spec) {
      expectedPaths.add(p);
      if (!recordedPaths.has(p)) {
        issues.push(`[visualIntent] '${p}' should declare visual intent (screen has a visualStyle sub-field) but plan.json's patterns.visual has no entry for it`);
      } else if (!specEqual(spec, recorded[p])) {
        issues.push(`[visualIntent] '${p}' plan.json entry ${JSON.stringify(recorded[p])} does not match the re-derived decision ${JSON.stringify(spec)}`);
      }
    } else if (recordedPaths.has(p)) {
      issues.push(`[visualIntent] '${p}' has a plan.json patterns.visual entry but re-deriving visualFor against the current IR returns null — stale plan entry`);
    }
  }
  for (const p of recordedPaths) {
    if (!expectedPaths.has(p)) {
      issues.push(`[visualIntent] plan.json declares visual intent for '${p}' but re-deriving the selector against the current IR no longer resolves it — stale plan entry`);
    }
  }

  // (b)+(e) generated-output markers: the hero-gap token (only when the archetype+IR actually
  // render a hero block) and the AppListCard radius token, each an exact-expected-substring check
  // (decided-but-absent AND present-but-undecided both fail by construction), plus a guard that
  // every radius: argument is an AppRadius.* token, never a bare number.
  for (const screen of screens) {
    const entry = (plan.entries ?? []).find((e: any) => e.schema === "screen" && (e.artifact === `screen:${screen.name}` || e.artifact.endsWith(`:screen:${screen.name}`)));
    if (!entry) continue; // a screen plan.json itself doesn't know about is out of scope for this gate
    const filePath = path.join(outDir, entry.file);
    if (!fs.existsSync(filePath)) continue; // reported by other gates already
    const src = fs.readFileSync(filePath, "utf8");
    const p = screenPath(screens, screen);
    const spec = visualFor(screen, flat);
    const comp = compositionFor(screen.type);

    if (comp.hasHero && screen.hero) {
      const heroScale = spec && spec.heroScale !== 1 ? spec.heroScale : 1;
      const token = heroScale === 0 ? "AppSpacing.sm" : heroScale === 2 ? "AppSpacing.xl" : `${comp.heroGap}.0`;
      const marker = `AppSpacing.md, AppSpacing.lg, AppSpacing.md, ${token}),`;
      if (!src.includes(marker)) {
        issues.push(`[visualIntent] '${p}' (${screen.name}) hero padding does not match the decided hierarchy (expected ${token})`);
      }
    }

    const decidedRadius = spec && spec.radiusScale.surface ? spec.radiusScale.surface : null;
    const radiusArgs = [...src.matchAll(/radius:\s*([^,)\s]+)/g)].map((m) => m[1] ?? "");
    if (decidedRadius && !radiusArgs.includes(decidedRadius)) {
      issues.push(`[visualIntent] '${p}' (${screen.name}) decided cornerRadius (${decidedRadius}) but no AppListCard radius: ${decidedRadius} marker found`);
    } else if (!decidedRadius && radiusArgs.length) {
      issues.push(`[visualIntent] '${p}' (${screen.name}) has no cornerRadius decided but the generated screen passes radius: ${radiusArgs[0]} anyway`);
    }
    for (const arg of radiusArgs) {
      if (!arg.startsWith("AppRadius.")) {
        issues.push(`[visualIntent] '${p}' (${screen.name}) emits a raw radius argument '${arg}' — must be an AppRadius.* token, never an IR-side number`);
      }
    }
  }

  return issues;
}

const TENANT_MARKERS = ["_inScope(", "_stampTenant(", "Session.instance.tenantId", "_items.where(_inScope)"];
function tenantCheck(ir: any, files: string[]): string[] {
  const issues: string[] = [];
  const scoped = new Set(tenantScopedEntities(ir).map((e) => e.name));
  if (!scoped.size) return issues;
  for (const repo of ir.repositories ?? []) {
    const entityName = listEntityName(repo);
    if (!entityName || !scoped.has(entityName)) continue;
    const declared = (ir.repositoryImpls ?? []).find((ri: any) => ri.contract === repo.name);
    const implBase = fileName(declared ? declared.name : `${repo.name}InMemoryImpl`);
    const f = files.find((p) => path.basename(p) === implBase);
    if (!f) {
      issues.push(`[tenant] repo '${repo.name}' (entity '${entityName}' has tenantId): generated impl '${implBase}' not found`);
      continue;
    }
    const src = fs.readFileSync(f, "utf8");
    for (const m of TENANT_MARKERS) {
      if (!src.includes(m)) issues.push(`[tenant] ${f}: missing '${m}' — tenant scoping not enforced on '${repo.name}'`);
    }
  }
  return issues;
}

// MF2 trust boundary, routing-side: an app declaring `attributes.auth` must boot to the persona
// gate and enforce per-role reachability — the guard scaffold (route.ts's auth branch) carries all
// four of these markers; once again each is gated on hasAuth, so a straight non-auth router that
// happened to keep `/login` would fail this check.
const AUTH_GUARD_MARKERS = ["kHomeRoutes", "guardPath", "AuthLoginScreen", "initialLocation: '/login'"];
function authGuardCheck(ir: any, files: string[]): string[] {
  if (!hasAuth(ir)) return [];
  const router = files.find((p) => path.basename(p) === "router.dart");
  if (!router) return [`[auth] app declares attributes.auth but no lib/core/router.dart exists`];
  const src = fs.readFileSync(router, "utf8");
  const missing = AUTH_GUARD_MARKERS.filter((m) => !src.includes(m));
  return missing.map((m) => `[auth] lib:core/router.dart missing '${m}' — auth guard not enforced`);
}

// validate.ts is handed the RAW IR read straight off disk — for an MF1 multi-feature IR
// (`"features": [...]`) that means `ir.entities` is undefined at the top level (entities live
// under `ir.features[].entities`; index.ts only builds the flattened/merged FeatureModel INSIDE
// generateApp, which validate.ts never sees). budgetCheck couldn't afford to inherit that
// silently: `attributes.budget` DOES live at the IR's top level for both shapes, so hasBudget(ir)
// is still true for a multi-feature IR, and a bare `ir.entities` lookup would flip from "vacuous
// pass" to an outright false FAIL (entity genuinely present, just unreachable at this path) —
// worse than silently skipping. Originally flattened locally just for budgetCheck/auditCheck/
// exportCheck/l10nCheck; G2b (LEFTOVER_NOTES.md) — moneyCheck/datepickerCheck/verdictCheck/
// tenantCheck/splitCheck/oracleCoverage had the exact same vacuous-no-op gap, just never caught
// because no prior multi-feature sample carried money/date fields or severity'd rules to expose
// it (see flattenedIr's businessRules/repositories/repositoryImpls fields, added for those).
function flattenedEntities(ir: any): any[] {
  if (Array.isArray(ir.entities)) return ir.entities;
  if (Array.isArray(ir.features)) return ir.features.flatMap((f: any) => f.entities ?? []);
  return [];
}

function flattenedScreens(ir: any): any[] {
  if (Array.isArray(ir.screens)) return ir.screens;
  if (Array.isArray(ir.features)) return ir.features.flatMap((f: any) => f.screens ?? []);
  return [];
}

// L3: `audited: true` is declared inside entities[] (feature-local, not an app-level attribute
// like budget), so it needs the same flattening treatment for the raw multi-feature IR shape.
function flattenedIr(ir: any): any {
  return {
    ...ir,
    entities: flattenedEntities(ir),
    screens: flattenedScreens(ir),
    // G2b/M2 (LEFTOVER_NOTES.md): moneyCheck/datepickerCheck/verdictCheck/tenantCheck all read
    // ir.businessRules/ir.repositories/ir.repositoryImpls directly too — the same vacuous-no-op
    // gap flattenedEntities/flattenedScreens already fixed for the other checks, just never
    // extended to these fields because no prior multi-feature sample carried money/date fields or
    // severity'd rules to expose it. Ledgerly-MVP's L2/L3 additions are the first that do.
    businessRules: Array.isArray(ir.businessRules) ? ir.businessRules : (ir.features ?? []).flatMap((f: any) => f.businessRules ?? []),
    repositories: Array.isArray(ir.repositories) ? ir.repositories : (ir.features ?? []).flatMap((f: any) => f.repositories ?? []),
    repositoryImpls: Array.isArray(ir.repositoryImpls) ? ir.repositoryImpls : (ir.features ?? []).flatMap((f: any) => f.repositoryImpls ?? []),
    // P5/D2 Slice 4: same vacuous-no-op gap the fields above were added for — statePlacementFor
    // reads ir.states directly (composition.ts), and index.ts's own multi-feature path merges the
    // exact same way (`states: app.features.flatMap((f) => f.states ?? [])`) before calling it, so
    // [states] needs the identical flattening or every multi-feature app's re-derivation would
    // silently find zero states and report every screen as a stale/missing plan entry.
    states: Array.isArray(ir.states) ? ir.states : (ir.features ?? []).flatMap((f: any) => f.states ?? []),
  };
}

// MF5: a declared `attributes.budget` must (a) resolve against a real entity + three actual Money
// fields (operations.ts's resolveBudget — mirrors [split]'s per-group structural validity check)
// and (b) actually emit core/budget.dart — mirrors [attachment]'s presence check. Deliberately no
// oracle requirement here (unlike [split]/[verdict]): BudgetLine is a pure calculation, not a
// RuleModel — see the task report for why a unit test (budget_test.dart) is the chosen proof
// instead of an oracle file.
function budgetCheck(ir: any, files: string[]): string[] {
  if (!hasBudget(ir)) return [];
  const issues: string[] = [];
  const resolved = resolveBudget({ ...ir, entities: flattenedEntities(ir) });
  if (!resolved) {
    const model = budgetOf(ir);
    issues.push(
      `[budget] attributes.budget declares entity '${model?.entity}' (limit='${model?.limitField}', committed='${model?.committedField}', actual='${model?.actualField}') but it does not resolve to an existing entity with three actual Money fields — unverifiable`,
    );
    return issues;
  }
  if (!files.some((f) => f.endsWith("/core/budget.dart"))) {
    issues.push(`[budget] app declares attributes.budget but generated output has no core/budget.dart (BudgetLine)`);
  }
  return issues;
}

// L3: every entity that opts into `audited: true` requires `attributes.auth` — an AuditEvent's
// `actor` is the signed-in Session's actorId (repository_impl.ts), so an audited entity with no
// real identity source would silently log a lie about who acted; types.ts's EntityModel.audited
// doc comment states this as a hard requirement, not an implicit assumption. When resolved, the
// app must actually emit core/audit.dart + core/audit_log_screen.dart — mirrors [attachment].
function auditCheck(ir: any, files: string[]): string[] {
  const flat = flattenedIr(ir);
  if (!hasAudit(flat)) return [];
  const issues: string[] = [];
  const audited = auditedEntities(flat);
  if (!hasAuth(flat)) {
    const names = audited.map((e: any) => e.name).join(", ");
    issues.push(
      `[audit] entit${audited.length === 1 ? "y" : "ies"} '${names}' declare audited: true but the app has no attributes.auth — an audit event's actor requires a real signed-in identity`,
    );
  }
  if (!files.some((f) => f.endsWith("/core/audit.dart"))) {
    issues.push(`[audit] app has audited entities but generated output has no core/audit.dart (AuditEvent/recordMutation/AuditLog)`);
  }
  if (!files.some((f) => f.endsWith("/core/audit_log_screen.dart"))) {
    issues.push(`[audit] app has audited entities but generated output has no core/audit_log_screen.dart (AuditLogScreen)`);
  }
  return issues;
}

// L3: every list screen that declares `export:` must resolve against a real `exported: bool`
// field (operations.ts's resolveExport) — mirrors [split]'s categoryField requirement. When at
// least one resolves, the app must emit core/export.dart. Also re-asserts, on the GENERATED
// screen source, that no secret-typed field ever became an export column — defense in depth
// behind exportableFields() already excluding them at generation time, same "prove it on the
// output, don't just trust the generator" posture [money]/[tenant] already take.
function exportCheck(ir: any, files: string[]): string[] {
  const flat = flattenedIr(ir);
  const declared = declaredExportScreens(flat);
  if (!declared.length) return [];
  const issues: string[] = [];
  let anyResolved = false;
  for (const screen of declared as any[]) {
    const resolved = resolveExport(flat, screen);
    if (!resolved) {
      issues.push(
        `[export] screen '${screen.name}' declares export: '${screen.export}' on entity '${screen.entity}' but that entity has no bool field named 'exported' — unverifiable`,
      );
      continue;
    }
    anyResolved = true;
    const secretFields = resolved.entity.fields.filter((f: any) => f.secret);
    if (secretFields.length) {
      const screenFile = files.find((f) => f.endsWith(`/${fileName(screen.name)}`));
      if (screenFile) {
        const src = fs.readFileSync(screenFile, "utf8");
        for (const sf of secretFields) {
          if (new RegExp(`'${sf.name}':`).test(src)) {
            issues.push(`[export] ${screenFile}: secret-typed field '${sf.name}' appears in an export row — must be excluded`);
          }
        }
      }
    }
  }
  if (anyResolved && !files.some((f) => f.endsWith("/core/export.dart"))) {
    issues.push(`[export] app has a resolved export screen but generated output has no core/export.dart (toCsv/toJson)`);
  }
  return issues;
}

// L4: a declared `attributes.locale` must emit the locale-aware AppStrings (both _en and _ar
// maps — proves infra.ts actually took the locale-aware branch, not the flat pre-L4 stub) and
// MaterialApp's locale/supportedLocales/localizationsDelegates wiring in main.dart — mirrors
// [auth]'s marker-based check on router.dart exactly.
const L10N_STRINGS_MARKERS = ["_en", "_ar", "static AppStrings of(BuildContext context)"];
// Pre-existing bug fix (unrelated to MF6, found while regenerating evidence samples): ba62b24
// (L4 RTL follow-up) made `locale:` conditional — "both" deliberately omits it now so the
// browser/OS locale resolves AR/RTL (G-L4-1) — but this marker list still required it
// unconditionally, so [l10n] FAILed on every "both" app (ledgerly/hr_service) since that fix
// landed. `onGenerateTitle:` is unconditional in every locale-aware branch, so it's the correct
// always-present marker instead.
const L10N_MAIN_MARKERS = ["onGenerateTitle:", "supportedLocales:", "localizationsDelegates:", "GlobalMaterialLocalizations.delegate"];
function l10nCheck(ir: any, files: string[]): string[] {
  if (!hasLocale(ir)) return [];
  const issues: string[] = [];
  const appStrings = files.find((f) => f.endsWith("/core/app_strings.dart"));
  if (!appStrings) {
    issues.push(`[l10n] app declares attributes.locale but generated output has no core/app_strings.dart`);
  } else {
    const src = fs.readFileSync(appStrings, "utf8");
    for (const m of L10N_STRINGS_MARKERS) {
      if (!src.includes(m)) issues.push(`[l10n] core/app_strings.dart missing '${m}' — not the locale-aware AppStrings`);
    }
  }
  const main = files.find((f) => f.endsWith("/main.dart"));
  if (!main) {
    issues.push(`[l10n] app declares attributes.locale but no lib/main.dart exists`);
  } else {
    const src = fs.readFileSync(main, "utf8");
    for (const m of L10N_MAIN_MARKERS) {
      if (!src.includes(m)) issues.push(`[l10n] lib/main.dart missing '${m}' — MaterialApp locale/RTL wiring not enforced`);
    }
  }
  return issues;
}

// MF6: attributes.outbox must emit core/outbox.dart (Outbox/OutboxMessage), and — mirrors
// [attachment]/[budget]'s "prove it on the output, don't just trust the generator" posture — at
// least one generated data/repositories/* impl must actually reference Outbox.instance.enqueue,
// not just declare the capability with no repo wired to it.
function outboxCheck(ir: any, files: string[]): string[] {
  if (!hasOutbox(ir)) return [];
  const issues: string[] = [];
  if (!files.some((f) => f.endsWith("/core/outbox.dart"))) {
    issues.push(`[outbox] app declares attributes.outbox but generated output has no core/outbox.dart (Outbox/OutboxMessage)`);
  }
  const referenced = files.some((f) => f.includes("/data/repositories/") && fs.readFileSync(f, "utf8").includes("Outbox.instance.enqueue"));
  if (!referenced) {
    issues.push(`[outbox] app declares attributes.outbox but no generated repository impl references Outbox.instance.enqueue`);
  }
  return issues;
}

// S1 (§3.1): platform=generation target; absent=flutter. Validates only the raw declared value —
// target dispatch (index.ts's generateApp) is a separate concern (§2.6 Single Responsibility) and
// is not touched here. Runs early (validateOutput calls this before the determinism regen below)
// since it's a cheap precondition check on the IR itself, independent of any generated output.
const VALID_PLATFORMS = new Set(["flutter", "swiftui"]);
function platformCheck(ir: any): string[] {
  const platform = ir?.attributes?.platform;
  if (platform === undefined) return [];
  if (!VALID_PLATFORMS.has(platform)) {
    return [`[platform] attributes.platform="${platform}" must be "flutter" or "swiftui" (absent=flutter)`];
  }
  return [];
}

// S2 (correction 3, §5.1.1): the generated Package.swift must declare `.iOS(.v17)` as the first
// `platforms: [` entry. `\s*` (not a literal space) tolerates any indentation/newline style the
// generator happens to use — the requirement is the declaration's presence, not its whitespace.
const SWIFTPKG_PLATFORM_RE = /platforms:\s*\[\s*\.iOS\(\.v17\)/;
function swiftPkgCheck(iosFiles: string[]): string[] {
  const pkgFile = iosFiles.find((f) => f.endsWith("/Package.swift"));
  if (!pkgFile || !SWIFTPKG_PLATFORM_RE.test(fs.readFileSync(pkgFile, "utf8"))) {
    return [`[swiftpkg] Package.swift missing or missing .iOS(.v17) platform declaration`];
  }
  return [];
}

// S-HERMETIC 14.1 (S_HERMETIC_IMPL_BRIEF_CLAUDE.md, SPIKE_S_HERMETIC_REPORT.md §13 D1): every
// regenerated app output must carry a committed `pubspec.lock` — it's the only artifact that
// pins the *transitive* dependency graph (the generated `pubspec.yaml` only ever carries caret
// ranges, ratified as staying that way). Severity split (ratified #2): a missing lock is an
// ERROR (a governance break — the commit-per-app policy silently lapsed); a lock whose `sdks:`
// dart floor differs from the declared toolchain floor is a WARNING only, logged into `issues`
// but never counted toward the numeric `lockfile` field that drives the FAIL sum — historical
// locks predating a floor bump are expected and accepted, not a defect. Returning
// {errors, warnings} separately (rather than one flat array) is what makes that split possible
// without a parallel severity-tagging scheme.
function lockfileCheck(outDir: string): { errors: string[]; warnings: string[] } {
  const lockPath = path.join(outDir, "pubspec.lock");
  if (!fs.existsSync(lockPath)) {
    return { errors: [`[lockfile] missing ${lockPath} — commit \`flutter pub get\`'s lockfile per app (S-HERMETIC policy, FLUTTER_TOOLCHAIN.md)`], warnings: [] };
  }
  const src = fs.readFileSync(lockPath, "utf8");
  const sdksBlock = src.match(/^sdks:\n((?:  .+\n?)*)/m)?.[1] ?? "";
  const dartFloor = sdksBlock.match(/^\s*dart:\s*"?([^"\n]+?)"?\s*$/m)?.[1];
  if (!dartFloor || dartFloor !== DART_SDK_FLOOR) {
    return {
      errors: [],
      warnings: [`[lockfile] ${lockPath} sdks.dart floor '${dartFloor ?? "<missing sdks: block>"}' differs from the declared toolchain floor '${DART_SDK_FLOOR}' (FLUTTER_TOOLCHAIN.md) — historical lock, accepted as a warning; refresh on the next natural regenerate`],
    };
  }
  return { errors: [], warnings: [] };
}

// S-HERMETIC 14.1: a pure regex over the emitted file set's HEADER BAND ONLY — the first
// HEADER_BAND_LINES lines, or fewer if an `import`/`dependencies:` line (the generated header's
// own end-of-band marker) appears sooner. Scoped this way on purpose: `naming.ts`'s `newIdExpr`
// (`DateTime.now().millisecondsSinceEpoch`) and `audit.ts`'s `recordMutation`
// (`final at = DateTime.now()`) are legitimate generated RUNTIME content deep in file bodies, not
// build-time stamps — a whole-file scan would false-positive on both (SPIKE_S_HERMETIC_REPORT.md
// §3.3/§9). A build-time date/timestamp leaking into the header band would break L2
// reproducibility (two generations of the same IR at different wall-clock times would then
// differ in their headers alone), so header-band presence is exactly what's ERROR-worthy here.
const HEADER_BAND_LINES = 4;
const HEADER_BAND_BOUNDARY_RE = /^\s*import\s|^dependencies:/;
const TIMESTAMP_DATE_RE = /\d{4}-\d{2}-\d{2}/;
const TIMESTAMP_STAMP_RE = /generated on |Generated on | at \d{1,2}:\d{2}/;
function timestampCheck(files: string[]): string[] {
  const issues: string[] = [];
  for (const f of files) {
    const lines = fs.readFileSync(f, "utf8").split("\n");
    const boundary = lines.findIndex((l) => HEADER_BAND_BOUNDARY_RE.test(l));
    const bandEnd = boundary === -1 ? Math.min(HEADER_BAND_LINES, lines.length) : Math.min(HEADER_BAND_LINES, boundary);
    const band = lines.slice(0, bandEnd).join("\n");
    if (TIMESTAMP_DATE_RE.test(band) || TIMESTAMP_STAMP_RE.test(band)) {
      issues.push(`[timestamp] ${f}: header band carries a build-time date/timestamp stamp — generated headers must stay dateless for L2 reproducibility`);
    }
  }
  return issues;
}

export interface ValidationResult {
  determinism: boolean;
  planDeterminism: number; // count of plan.json-vs-fresh-derivation diffs (S-CTX)
  headers: number;   // count of files missing the header
  secrets: number;   // count of files with secret literals
  idioms: number;    // count of files with forbidden idioms
  arch: number;      // count of files with arch violations
  oracle: number;    // count of business rules missing or with zero-case oracle coverage
  fidelity: number;  // count of state artifacts whose plan.json strategy doesn't match the emitted template
  money: number;     // count of money-declared fields emitted as double (P7-L1)
  datepicker: number; // count of DateTime fields rendered as a bare TextField, no showDatePicker (G2)
  verdict: number;   // count of severity'd rules with invalid severity, empty message, or missing oracle (L2)
  split: number;     // count of split-group issues: missing/zero-case Split oracle, or a split child with no category field (MF4)
  tenant: number;    // count of tenantId-carrying repos whose generated impl lacks the scoped marker set (MF2)
  auth: number;      // count of auth-guard markers missing from a declared-auth app's router (MF2)
  attachment: number; // count of attachment-capable apps missing core/attachment.dart (MF3)
  budget: number;    // count of budget-declaration issues: unresolved entity/fields, or missing core/budget.dart (MF5)
  audit: number;     // count of audit issues: audited entity with no auth, or missing core/audit.dart|audit_log_screen.dart (L3)
  exportGate: number; // count of export issues: unresolved export declaration, secret field in an export row, or missing core/export.dart (L3)
  l10n: number;      // count of l10n issues: AppStrings not locale-aware, or main.dart missing locale/RTL wiring (L4)
  theme: number;     // count of D1 theme-wiring issues: main.dart not on buildTheme(), raw colorSchemeSeed literal, themeMode drift, or seed/palette mismatch (D1)
  contrast: number;  // count of WCAG contrast issues in emitted core/theme.dart tokens, real usage pairs only (D2#1)
  outbox: number;    // count of outbox issues: missing core/outbox.dart, or no repo impl references Outbox.instance.enqueue (MF6)
  symbols: number;   // count of cross-feature type-name collisions in the symbol table (MF1, M3)
  shell: number;     // count of global-nav-shell issues: missing/unexpected shell, bad destination order/title/icon (P1)
  search: number;    // count of per-list-search issues: plan/output drift, missing/unexpected SearchBar (P2)
  scroll: number;    // count of per-screen-scroll issues: plan/output drift, missing/unexpected scroll listener (P3)
  actions: number;   // count of per-screen-action issues: plan/output drift, missing/unexpected action, unconfirmed delete, save FAB (P4)
  states: number;    // count of per-screen state-placement issues: plan/output drift, missing/unexpected loading/error/empty/emptyCta/retry/refresh marker (P5/D2)
  visualIntent: number; // count of visual-intent issues: plan/output drift, unapproved nested visualStyle value, v1-closed-enum violation, raw radius literal (S1)
  lockfile: number;  // count of missing pubspec.lock (ERROR only; floor-differs is a warning, logged but not counted — S-HERMETIC)
  timestamps: number; // count of header-band build-time date/timestamp stamps (S-HERMETIC)
  platform: number;  // count of invalid attributes.platform values — not "flutter"/"swiftui"/absent (S1)
  swiftpkg: number;  // count of Package.swift issues: missing file or missing .iOS(.v17) declaration (S2)
  swiftarch: number; // count of Swift Domain-layer files importing SwiftUI/UIKit (S2, §6.3)
  swiftdeterminism: number; // count of non-empty diffs between two swiftui generations of the same IR (S2)
  files: number;
  issues: string[];
}

// S2 (§6.3, §6.4): a swiftui-target IR emits ONLY <outDir>/ios — none of the Flutter-specific
// checks below (all of which assume <outDir>/lib exists, from `walk()` down to every individual
// xxxCheck) apply, and several would throw outright on a missing directory. A dedicated pipeline
// — not isSwiftUI branches threaded through every Flutter check — keeps the Flutter path in
// validateOutput byte-for-byte untouched (§2.6 Open/Closed).
function validateSwiftUIOutput(ir: any, outDir: string, irPath: string): ValidationResult {
  const issues: string[] = [];

  const platformIssues = platformCheck(ir);
  issues.push(...platformIssues);
  const platform = platformIssues.length;

  const iosDir = path.join(outDir, "ios");
  const iosFiles = walkSwift(iosDir);

  const swiftpkgIssues = swiftPkgCheck(iosFiles);
  issues.push(...swiftpkgIssues);
  const swiftpkg = swiftpkgIssues.length;

  const swiftarchIssues: string[] = [];
  for (const f of iosFiles) {
    const v = swiftArchCheck(f, fs.readFileSync(f, "utf8"));
    if (v) swiftarchIssues.push(`[swiftarch] ${v}`);
  }
  issues.push(...swiftarchIssues);
  const swiftarch = swiftarchIssues.length;

  // [swiftdeterminism]: regenerate once fresh and diff against the already-generated outDir/ios —
  // same "generate once, diff against outDir" perf posture as [determinism] below, applied to
  // ios/ instead of lib/. Unlike that check, this wraps the diff in try/catch — `diff` exits
  // non-zero when it finds a difference, which is the exact case this gate exists to report, not
  // an unexpected failure to crash on.
  const swiftdeterminismIssues: string[] = [];
  const tmpSwift = `${outDir}.swift.v1`;
  execSync(`npx ts-node --transpile-only builder/src/index.ts ${irPath} ${tmpSwift}`, { stdio: "pipe" });
  let swiftDiff = "";
  try {
    swiftDiff = execSync(`diff -r ${tmpSwift}/ios ${iosDir}`, { stdio: "pipe" }).toString();
  } catch (e: any) {
    swiftDiff = e.stdout ? e.stdout.toString() : String(e.message ?? e);
  }
  if (swiftDiff.trim() !== "") swiftdeterminismIssues.push(`[swiftdeterminism] ${swiftDiff.trim()}`);
  issues.push(...swiftdeterminismIssues);
  const swiftdeterminism = swiftdeterminismIssues.length;
  fs.rmSync(tmpSwift, { recursive: true, force: true });

  return {
    // Flutter-only gates: N/A for a swiftui-target IR (no lib/ output exists in S2) — vacuous
    // pass, not "unchecked", since nothing in this pipeline could ever produce a Flutter issue.
    determinism: true, headers: 0, secrets: 0, idioms: 0, arch: 0, oracle: 0, fidelity: 0, money: 0,
    datepicker: 0, verdict: 0, split: 0, tenant: 0, auth: 0, attachment: 0, budget: 0, audit: 0,
    exportGate: 0, l10n: 0, outbox: 0, symbols: 0, shell: 0, search: 0, scroll: 0, actions: 0, states: 0, visualIntent: 0, planDeterminism: 0,
    theme: 0, contrast: 0, lockfile: 0, timestamps: 0,
    platform, swiftpkg, swiftarch, swiftdeterminism,
    files: iosFiles.length, issues,
  };
}

export function validateOutput(ir: any, outDir: string, irPath = "builder/samples/expense.semantic.ir.json"): ValidationResult {
  // S2: dispatch to the dedicated Swift pipeline above — see its own comment for why this is an
  // early return rather than isSwiftUI branches threaded through the Flutter body below.
  if (isSwiftUI(ir)) {
    return validateSwiftUIOutput(ir, outDir, irPath);
  }

  const issues: string[] = [];

  // Platform (S1, §3.1): cheap precondition check on the declared IR value, before any generated
  // output exists to inspect — does not weaken or reorder any check below it.
  const platformIssues = platformCheck(ir);
  issues.push(...platformIssues);
  const platform = platformIssues.length;

  // Determinism — generate ONCE fresh and diff against the already-generated outDir/lib.
  // (Perf: previously generated twice to tmp1/tmp2; the workflow always validates a freshly
  // generated outDir, so one fresh generation + a diff against it is an equivalent check at half
  // the cost — ~30-60s saved per validate across the 11-sample sweep. TIMING_LOG.md.)
  const tmp1 = `${outDir}.v1`;
  execSync(`npx ts-node --transpile-only builder/src/index.ts ${irPath} ${tmp1}`, { stdio: "pipe" });
  // `diff` exits non-zero the moment it finds a difference — exactly the case this gate exists to
  // report via `issues.push` below, not an unexpected failure to crash the whole validate run on
  // (found while exercising S-HERMETIC's [timestamp] negative control: a hand-edited header is
  // real drift and must reach `issues`/[timestamp], not throw before either ever runs). Mirrors
  // the try/catch [swiftdeterminism] already uses a few dozen lines below, for the same reason.
  let diff = "";
  try {
    diff = execSync(`diff -r ${tmp1}/lib ${outDir}/lib`, { stdio: "pipe" }).toString();
  } catch (e: any) {
    diff = e.stdout ? e.stdout.toString() : String(e.message ?? e);
  }
  const determinism = diff.trim() === "";
  if (!determinism) issues.push(diff.trim());

  // Plan determinism (S-CTX, DETERMINISM_CONTRACT.md §4): the plan.json on disk must exactly
  // match a fresh generate of this IR — same regen, one more file. Runs against plan.json only
  // (the decision layer), complementing [determinism]'s lib/ diff above; `writePlan` produces a
  // stable, key-stable JSON, so JSON.stringify compare (not byte diff) is sufficient and robust.
  // Catches: human hand-edits, an LLM/wall-clock/purity leak in any plan-field helper (grills
  // C1/C15), or a stale plan. Negative-control proven — see S-CTX brief.
  let planDeterminism = 0;
  const planDeterminismIssues: string[] = [];
  const freshPlan = path.join(tmp1, "plan.json");
  const diskPlan = path.join(outDir, "plan.json");
  if (!fs.existsSync(diskPlan)) {
    planDeterminismIssues.push(`[plan-determinism] plan.json missing in ${outDir} — cannot verify plan-vs-IR`);
  } else if (!fs.existsSync(freshPlan)) {
    planDeterminismIssues.push(`[plan-determinism] fresh generate of this IR produced no plan.json in ${tmp1} — the builder changed shape`);
  } else {
    const fresh = JSON.stringify(JSON.parse(fs.readFileSync(freshPlan, "utf8")));
    const disk = JSON.stringify(JSON.parse(fs.readFileSync(diskPlan, "utf8")));
    if (fresh !== disk) {
      planDeterminismIssues.push(
        "[plan-determinism] plan.json on disk differs from a fresh generate of this IR — the plan is not purely IR-derived (hand-edit, stale plan, or a non-deterministic/LLM source leaked into a plan-field helper). Regenerate, don't hand-edit (DETERMINISM_CONTRACT.md).",
      );
    }
  }
  issues.push(...planDeterminismIssues);
  planDeterminism = planDeterminismIssues.length;

  fs.rmSync(tmp1, { recursive: true, force: true });

  // Static checks.
  const files = walk(path.join(outDir, "lib"));
  let headers = 0, secrets = 0, idioms = 0, arch = 0;
  for (const f of files) {
    const src = fs.readFileSync(f, "utf8");
    if (!/\[generated\] generator=/.test(src)) { issues.push(`[header] MISSING in ${f}`); headers++; }
    if (/(https?:\/\/[^'"\s]*@|dsn|sk_live_|api[_-]?key\s*[:=]\s*['"][A-Za-z0-9]{8,}|secret\s*[:=])/i.test(src)) { issues.push(`[secret] LITERAL in ${f}`); secrets++; }
    if (/dart\.library\.(html|io|js_interop|js_util)/.test(src)) { issues.push(`[idiom] conditional import in ${f}`); idioms++; }
    if (/catch\s*\(\s*_?\s*\)\s*\{\s*\}/.test(src)) { issues.push(`[idiom] swallowed empty catch in ${f}`); idioms++; }
    const a = archCheck(f, src);
    if (a) { issues.push(`[arch] ${a}`); arch++; }
  }

  // Oracle coverage (§9.4): a business rule with no (or empty) oracle is unverified
  // generated code — the correctness boundary DESIGN §0 treats as non-negotiable.
  // G2b: oracleCoverage reads ir.businessRules directly — flattenedIr so a multi-feature IR's
  // rules (declared per-feature) are actually seen instead of vacuously reporting zero issues.
  const oc = oracleCoverage(flattenedIr(ir), oracleDirFor(irPath));
  for (const r of [...oc.missing, ...oc.empty]) issues.push(`[oracle] ${r}: missing/zero-case oracle — unverifiable`);
  const oracle = oc.missing.length + oc.empty.length;

  // Strategy fidelity (P3-C4): plan.json's declared per-state strategy vs the emitted template.
  const fidelityIssues = stateStrategyFidelity(outDir);
  issues.push(...fidelityIssues);
  const fidelity = fidelityIssues.length;

  // Money-never-double (P7-L1). G2b: flattenedIr — see moneyCheck's own note below.
  const moneyIssues = moneyCheck(flattenedIr(ir), files);
  issues.push(...moneyIssues);
  const money = moneyIssues.length;

  // Real date picker, not free-typed text (G2). G2b: flattenedIr, same reasoning as moneyCheck.
  const datepickerIssues = datepickerCheck(flattenedIr(ir), files);
  issues.push(...datepickerIssues);
  const datepicker = datepickerIssues.length;

  // Policy verdicts (L2): severity'd rules need a valid severity, a non-empty message, and oracle
  // coverage — stricter than the general [oracle] gate above. G2b: flattenedIr — ir.businessRules
  // lives per-feature on a multi-feature IR, same gap as oracleCoverage above.
  const verdictIssues = verdictCheck(flattenedIr(ir), oracleDirFor(irPath));
  issues.push(...verdictIssues);
  const verdict = verdictIssues.length;

  // Split/allocation (MF4): a declared split group needs oracle coverage for validateSplit and a
  // category field to render — stricter than the general [oracle] gate, which never sees this
  // (validateSplit isn't a business rule). G2b: flattenedIr — hasSplitGroups/splitGroupFor read
  // ir.entities directly.
  const splitIssues = splitCheck(flattenedIr(ir), oracleDirFor(irPath));
  issues.push(...splitIssues);
  const split = splitIssues.length;

  // Tenant scoping (MF2): every tenantId-carrying repo's impl must actually filter/stamp rows.
  // G2b: flattenedIr — tenantScopedEntities reads ir.entities, and this check itself reads
  // ir.repositories/ir.repositoryImpls, all per-feature on a multi-feature IR.
  const tenantIssues = tenantCheck(flattenedIr(ir), files);
  issues.push(...tenantIssues);
  const tenant = tenantIssues.length;

  // Symbol-table collisions (M3, MF1): two features declaring the same type name — checked
  // against the RAW ir (not flattenedIr) since this is specifically about the per-feature
  // structure that causes the collision in the first place.
  const symbolIssues = symbolCollisionCheck(ir);
  issues.push(...symbolIssues);
  const symbols = symbolIssues.length;

  // Auth guard (MF2): a declared-auth app must boot to the persona gate and route per-role.
  const authIssues = authGuardCheck(ir, files);
  issues.push(...authIssues);
  const auth = authIssues.length;

  // Attachment/OCR port (MF3): an app that opts into attachments must actually emit
  // core/attachment.dart (the ReceiptOcrPort + mock) — mirrors [split]/[money]: the gate proves
  // the capability is present, not just that the IR declares it.
  const attachmentIssues: string[] = [];
  if (hasAttachments(ir) && !files.some((f) => f.endsWith("/core/attachment.dart"))) {
    attachmentIssues.push("[attachment] app declares attributes.attachments but generated output has no core/attachment.dart (ReceiptOcrPort + mock)");
  }
  issues.push(...attachmentIssues);
  const attachment = attachmentIssues.length;

  // Budget/quota (MF5): a declared budget must resolve to a real entity + three Money fields and
  // actually emit core/budget.dart.
  const budgetIssues = budgetCheck(ir, files);
  issues.push(...budgetIssues);
  const budget = budgetIssues.length;

  // Audit log (L3): every audited entity requires attributes.auth; a resolved audit trail must
  // emit core/audit.dart + core/audit_log_screen.dart.
  const auditIssues = auditCheck(ir, files);
  issues.push(...auditIssues);
  const audit = auditIssues.length;

  // Export (L3): every declared export must resolve to a real `exported: bool` field, no
  // secret-typed field may appear in an export row, and a resolved export must emit
  // core/export.dart.
  const exportIssues = exportCheck(ir, files);
  issues.push(...exportIssues);
  const exportGate = exportIssues.length;

  // l10n (L4): a locale-aware app must emit locale-aware AppStrings + MaterialApp locale/RTL wiring.
  const l10nIssues = l10nCheck(ir, files);
  issues.push(...l10nIssues);
  const l10n = l10nIssues.length;

  // Theme wiring (D1, DESIGN_OPTS §1): the app root must render the token system, not a raw
  // colorSchemeSeed literal; a declared brand seed must actually derive AppColors.primary.
  const themeIssues = themeCheck(ir, files);
  issues.push(...themeIssues);
  const theme = themeIssues.length;

  // Contrast (D2#1, SPIKE_S6_REPORT.md §14.1): WCAG ratio over the same core/theme.dart tokens
  // themeCheck just verified are actually wired in, restricted to pairs the generator actually
  // paints (AppStatusDot, AppChip label-on-tint) — see contrastCheck's own comment for scoping.
  const contrastIssues = contrastCheck(ir, files);
  issues.push(...contrastIssues);
  const contrast = contrastIssues.length;

  // Outbox (MF6): a declared outbox must emit core/outbox.dart and be actually referenced by at
  // least one generated repository impl.
  const outboxIssues = outboxCheck(ir, files);
  issues.push(...outboxIssues);
  const outbox = outboxIssues.length;

  // Global-nav shell (P1): a multi-feature app must emit exactly the shell composition.ts decided
  // — right existence, right destination order, right title/icon per destination.
  const shellIssues = shellCheck(ir, outDir, files);
  issues.push(...shellIssues);
  const shell = shellIssues.length;

  // Per-list search (P2): plan.json's recorded search decisions must match a fresh re-derivation,
  // and only the marked screens may render a SearchBar.
  const searchIssues = searchCheck(ir, outDir, files);
  issues.push(...searchIssues);
  const search = searchIssues.length;

  // Per-screen scroll (P3): plan.json's recorded scroll decisions must match a fresh
  // re-derivation, list/detail screens must render the scroll listener, and wizard/form screens
  // must not.
  const scrollIssues = scrollCheck(ir, outDir, files);
  issues.push(...scrollIssues);
  const scroll = scrollIssues.length;

  // Per-screen actions (P4): plan.json's recorded action decisions must match a fresh
  // re-derivation (same actionsFor), every screen's output must agree (positive set renders, null
  // set absent), Delete must be confirm-guarded, and no Save FAB may appear (invariants 3-8).
  const actionsIssues = actionsCheck(ir, outDir, files);
  issues.push(...actionsIssues);
  const actions = actionsIssues.length;

  // Per-screen state placement (P5/D2, the FINAL slice): plan.json's recorded loading/error/
  // empty/emptyCta/retry/refresh decisions must match a fresh re-derivation (same
  // statePlacementFor), and every screen's output must agree with the APPLICABLE contract (not a
  // blind "render all three" check — §15 REJECTED that).
  const statesIssues = statesCheck(ir, outDir, files);
  issues.push(...statesIssues);
  const states = statesIssues.length;

  // Per-screen visual intent (S1): plan.json's recorded hierarchy/cornerRadius/personality
  // decisions must match a fresh re-derivation (same visualFor), every screen's output must agree
  // (hero-gap token, AppListCard radius token, never a raw literal), the v1 closed enum is
  // enforced (no imagery/emphasis), and no unattested nested visualStyle value survives (D4).
  const visualIntentIssues = visualIntentCheck(ir, outDir, files);
  issues.push(...visualIntentIssues);
  const visualIntent = visualIntentIssues.length;

  // Lockfile governance (S-HERMETIC 14.1): missing pubspec.lock is an ERROR (counted below);
  // floor-differs is a WARNING, logged into issues but never counted toward `lockfile`.
  const lockfileResult = lockfileCheck(outDir);
  issues.push(...lockfileResult.errors, ...lockfileResult.warnings);
  const lockfile = lockfileResult.errors.length;

  // Timestamp absence (S-HERMETIC 14.1): header-band-only, never body content (naming.ts/audit.ts
  // runtime DateTime.now() must not trip this).
  const timestampIssues = timestampCheck(files);
  issues.push(...timestampIssues);
  const timestamps = timestampIssues.length;

  return {
    determinism, headers, secrets, idioms, arch, oracle, fidelity, money, datepicker, verdict, split,
    tenant, symbols, auth, attachment, budget, audit, exportGate, l10n, theme, contrast, outbox, platform, shell, search,
    scroll, actions, states, visualIntent, lockfile, timestamps,
    planDeterminism,
    // Swift-only gates: N/A for a flutter-target IR (no ios/ output exists) — vacuous pass, same
    // reasoning as the Flutter-only fields validateSwiftUIOutput above zeroes out.
    swiftpkg: 0, swiftarch: 0, swiftdeterminism: 0,
    files: files.length, issues,
  };
}

function main() {
  const irPath = process.argv[2] ?? "builder/samples/expense.semantic.ir.json";
  const outDir = process.argv[3] ?? "builder/output/generated_app";
  const ir = JSON.parse(fs.readFileSync(irPath, "utf8"));
  const r = validateOutput(ir, outDir, irPath);

  // S2: a swiftui-target IR only ever populates platform/swiftpkg/swiftarch/swiftdeterminism —
  // printing the full Flutter gate list below would report misleading PASSes for checks that
  // never ran (no oracle coverage was verified, no money check ran, etc.) against ios/ output.
  if (isSwiftUI(ir)) {
    console.log(`[platform] ${r.platform === 0 ? "PASS" : "FAIL (" + r.platform + ")"}`);
    console.log(`[swiftpkg] ${r.swiftpkg === 0 ? "PASS" : "FAIL (" + r.swiftpkg + ")"}`);
    console.log(`[swiftarch] ${r.swiftarch === 0 ? "PASS" : "FAIL (" + r.swiftarch + ")"}`);
    console.log(`[swiftdeterminism] ${r.swiftdeterminism === 0 ? "PASS" : "FAIL (" + r.swiftdeterminism + ")"} across ${r.files} files`);
    const swiftFailed = r.platform + r.swiftpkg + r.swiftarch + r.swiftdeterminism > 0;
    console.log(swiftFailed ? "\nVALIDATION FAILED" : "\nVALIDATION PASSED");
    process.exit(swiftFailed ? 1 : 0);
  }

  console.log(`[platform] ${r.platform === 0 ? "PASS" : "FAIL (" + r.platform + ")"}`);
  console.log(`[determinism] ${r.determinism ? "PASS (byte-identical)" : "FAIL"}`);
  console.log(`[plan-determinism] ${r.planDeterminism === 0 ? "PASS" : "FAIL (" + r.planDeterminism + ")"}`);
  console.log(`[headers] ${r.headers === 0 ? "PASS" : "FAIL (" + r.headers + ")"} across ${r.files} files`);
  console.log(`[secrets] ${r.secrets === 0 ? "PASS" : "FAIL (" + r.secrets + ")"}`);
  console.log(`[forbidden-idioms] ${r.idioms === 0 ? "PASS" : "FAIL (" + r.idioms + ")"}`);
  console.log(`[architecture] ${r.arch === 0 ? "PASS" : "FAIL (" + r.arch + ")"}`);
  console.log(`[oracle] ${r.oracle === 0 ? "PASS" : "FAIL (" + r.oracle + ")"}`);
  console.log(`[strategy-fidelity] ${r.fidelity === 0 ? "PASS" : "FAIL (" + r.fidelity + ")"}`);
  console.log(`[money] ${r.money === 0 ? "PASS" : "FAIL (" + r.money + ")"}`);
  console.log(`[datepicker] ${r.datepicker === 0 ? "PASS" : "FAIL (" + r.datepicker + ")"}`);
  console.log(`[verdict] ${r.verdict === 0 ? "PASS" : "FAIL (" + r.verdict + ")"}`);
  console.log(`[split] ${r.split === 0 ? "PASS" : "FAIL (" + r.split + ")"}`);
  console.log(`[tenant] ${r.tenant === 0 ? "PASS" : "FAIL (" + r.tenant + ")"}`);
  console.log(`[symbols] ${r.symbols === 0 ? "PASS" : "FAIL (" + r.symbols + ")"}`);
  console.log(`[auth] ${r.auth === 0 ? "PASS" : "FAIL (" + r.auth + ")"}`);
  console.log(`[attachment] ${r.attachment === 0 ? "PASS" : "FAIL (" + r.attachment + ")"}`);
  console.log(`[budget] ${r.budget === 0 ? "PASS" : "FAIL (" + r.budget + ")"}`);
  console.log(`[audit] ${r.audit === 0 ? "PASS" : "FAIL (" + r.audit + ")"}`);
  console.log(`[export] ${r.exportGate === 0 ? "PASS" : "FAIL (" + r.exportGate + ")"}`);
  console.log(`[l10n] ${r.l10n === 0 ? "PASS" : "FAIL (" + r.l10n + ")"}`);
  console.log(`[theme] ${r.theme === 0 ? "PASS" : "FAIL (" + r.theme + ")"}`);
  console.log(`[contrast] ${r.contrast === 0 ? "PASS" : "FAIL (" + r.contrast + ")"}`);
  console.log(`[outbox] ${r.outbox === 0 ? "PASS" : "FAIL (" + r.outbox + ")"}`);
  console.log(`[shell] ${r.shell === 0 ? "PASS" : "FAIL (" + r.shell + ")"}`);
  console.log(`[search] ${r.search === 0 ? "PASS" : "FAIL (" + r.search + ")"}`);
  console.log(`[scroll] ${r.scroll === 0 ? "PASS" : "FAIL (" + r.scroll + ")"}`);
  console.log(`[actions] ${r.actions === 0 ? "PASS" : "FAIL (" + r.actions + ")"}`);
  console.log(`[states] ${r.states === 0 ? "PASS" : "FAIL (" + r.states + ")"}`);
  console.log(`[visualIntent] ${r.visualIntent === 0 ? "PASS" : "FAIL (" + r.visualIntent + ")"}`);
  console.log(`[lockfile] ${r.lockfile === 0 ? "PASS" : "FAIL (" + r.lockfile + ")"}`);
  console.log(`[timestamp] ${r.timestamps === 0 ? "PASS" : "FAIL (" + r.timestamps + ")"}`);
  const failed = !r.determinism || r.headers + r.secrets + r.idioms + r.arch + r.oracle + r.fidelity + r.money + r.datepicker + r.verdict + r.split + r.tenant + r.symbols + r.auth + r.attachment + r.budget + r.audit + r.exportGate + r.l10n + r.theme + r.contrast + r.outbox + r.platform + r.shell + r.search + r.scroll + r.actions + r.states + r.visualIntent + r.lockfile + r.timestamps > 0;
  console.log(failed ? "\nVALIDATION FAILED" : "\nVALIDATION PASSED");
  process.exit(failed ? 1 : 0);
}

if (require.main === module) main();
