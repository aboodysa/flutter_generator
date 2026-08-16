import { FeatureModel } from "./types";
import { fileName } from "./dart";
import { crudFormTargets, crudFormScreenName, hasMoneyFields, hasPolicyRules, policyEntities, hasSplitGroups, hasAuth, authPersonas, hasAttachments, resolveBudget, hasAudit, hasExport, hasOutbox } from "./operations";

// Symbol table + package naming — the single source of truth for cross-reference resolution (A6).
export function pkgName(feature: string): string {
  return `rasheed_replica_${feature}`.replace(/[^a-z0-9_]/g, "_");
}

/**
 * Build the symbol table: typeName → package path (features/<f>/<layer>/<file>.dart).
 * Every generator resolves cross-references through this, never by ad-hoc string matching.
 */
export function buildSymbols(ir: FeatureModel): Map<string, string> {
  const m = new Map<string, string>();
  const add = (name: string, layer: string, file: string) => m.set(name, `features/${ir.name}/${layer}/${file}`);

  for (const e of ir.enums ?? []) add(e.name, "domain/entities", fileName(e.name));
  for (const v of ir.valueObjects ?? []) add(v.name, "domain/entities", fileName(v.name));
  for (const q of ir.queries ?? []) add(q.name, "domain/entities", fileName(q.name));
  for (const w of ir.wrappers ?? []) add(w.name, "domain/entities", fileName(w.name));
  for (const e of ir.entities ?? []) {
    add(e.name, "domain/entities", fileName(e.name));
    add(`${e.name}Model`, "data/models", fileName(e.name).replace(/\.dart$/, "_model.dart"));
  }
  for (const r of ir.repositories ?? []) add(r.name, "domain/repositories", fileName(r.name));
  for (const u of ir.useCases ?? []) add(u.name, "domain/usecases", fileName(u.name));
  for (const d of ir.datasources ?? []) add(d.name, "data/datasources", fileName(d.name));
  for (const ri of ir.repositoryImpls ?? []) add(ri.name, "data/repositories", fileName(ri.name));
  for (const repo of ir.repositories ?? []) {
    if (!(ir.repositoryImpls ?? []).some((ri) => ri.contract === repo.name)) {
      add(`${repo.name}InMemoryImpl`, "data/repositories", fileName(`${repo.name}InMemoryImpl`));
    }
  }
  for (const s of ir.states ?? []) add(s.name, "presentation/state", fileName(s.name));
  for (const sc of ir.screens ?? []) add(sc.name, "presentation/screens", fileName(sc.name));
  for (const entity of crudFormTargets(ir).keys()) {
    const n = crudFormScreenName(entity);
    add(n, "presentation/screens", fileName(n));
  }
  for (const sm of ir.stateMachines ?? []) add(`${sm.name}StateMachine`, "domain/state_machines", fileName(`${sm.name}StateMachine`));
  for (const f of ir.forms ?? []) add(f.name, "presentation/forms", fileName(f.name));
  for (const r of ir.businessRules ?? []) add(r.name, "domain/rules", fileName(r.name));
  if ((ir.useCases ?? []).some((u) => u.paramType === "NoParams")) m.set("NoParams", "core/no_params.dart");
  // L4: core/app_strings.dart is emitted unconditionally for every app (like components.dart),
  // so this registration is unconditional too — screen.ts/crud_form.ts only reference the symbol
  // when hasLocale(ir) is true, but the path must resolve either way.
  m.set("AppStrings", "core/app_strings.dart");
  if (hasMoneyFields(ir)) m.set("Money", "core/money.dart");
  if (hasPolicyRules(ir)) {
    m.set("PolicyVerdict", "core/policy.dart");
    m.set("PolicySeverity", "core/policy.dart");
    for (const entityName of policyEntities(ir)) {
      m.set(`evaluate${entityName}Policy`, `features/${ir.name}/domain/policy/${fileName(entityName).replace(/\.dart$/, "_policy.dart")}`);
    }
  }
  if (hasSplitGroups(ir)) {
    m.set("SplitLine", "core/split.dart");
    m.set("validateSplit", "core/split.dart");
    m.set("SplitRowControllers", "core/split.dart");
  }
  if (hasAttachments(ir)) {
    m.set("ReceiptAttachment", "core/attachment.dart");
    m.set("OcrResult", "core/attachment.dart");
    m.set("ReceiptOcrPort", "core/attachment.dart");
    m.set("MockReceiptOcr", "core/attachment.dart");
    m.set("synthesizeAttachment", "core/attachment.dart");
    m.set("kLowOcrConfidence", "core/attachment.dart");
  }
  if (resolveBudget(ir)) {
    m.set("BudgetLine", "core/budget.dart");
  }
  // L3: unlike MF2's auth symbols, `audited`/`export:` are per-entity/per-screen facts declared
  // WITHIN a feature (not app-level attributes), so a per-feature buildSymbols(f) call already
  // sees them correctly — no addAuditSymbols-after-merge step needed (contrast the comment on
  // addAuthSymbols below).
  if (hasAudit(ir)) {
    m.set("AuditEvent", "core/audit.dart");
    m.set("recordMutation", "core/audit.dart");
    m.set("AuditLog", "core/audit.dart");
    m.set("AuditLogScreen", "core/audit_log_screen.dart");
  }
  if (hasExport(ir)) {
    m.set("toCsv", "core/export.dart");
    m.set("toJson", "core/export.dart");
  }
  // MF6: like budget above, attributes.outbox is app-level but a single-feature IR carries app
  // attributes directly on itself, so this per-feature call already sees it correctly; the
  // multi-feature merge (index.ts's generateMultiFeatureApp) needs its own post-merge fix instead
  // (mirrors MF5's BudgetLine fix), since app-level attributes aren't visible to any one feature.
  if (hasOutbox(ir)) {
    m.set("Outbox", "core/outbox.dart");
  }
  addAuthSymbols(m, ir);
  return m;
}

// MF2: auth core symbols (Session/Persona live in core/session.dart, the login screen in
// core/auth_login_screen.dart; every named persona also resolves there since its type is just
// Persona). Exported separately because the multi-feature path (index.ts) builds one merged
// symbol table from each feature's buildSymbols() — app-level `attributes.auth` isn't attached to
// any single feature, so the per-feature buildSymbols calls never add these; generateMultiFeatureApp
// calls this after merging instead. Single-feature buildSymbols() calls it itself.
export function addAuthSymbols(m: Map<string, string>, ir: FeatureModel): void {
  if (!hasAuth(ir)) return;
  m.set("Session", "core/session.dart");
  m.set("Persona", "core/session.dart");
  for (const p of authPersonas(ir)) m.set(p.name, "core/session.dart");
  m.set("kPersonas", "core/session.dart");
  m.set("AuthLoginScreen", "core/auth_login_screen.dart");
}
