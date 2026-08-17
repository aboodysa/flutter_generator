# S-P4 — Capability-driven actions: does the ActionSpec proposal actually improve the generated app?

## 1. Status

Research-only spike, per `SPIKE_PROTOCOL.md`. Read-only — no `builder/src` changes, no commits.
All claims below grounded in repo source + generated output inspected this session.

## 2. Hypothesis

> "Deriving a per-screen action list from existing IR capability predicates (`operations.ts`) and
> rendering it from a decided payload — with an `ActionSpec` schema carrying
> `{kind, label, icon, enablement, confirm?, presentation}`, an `[actions]` validate gate, a
> Delete confirm dialog, an Audit entry point, and an extended-FAB Save — improves the generated
> CRUD experience and stays deterministic."

The spike must test whether the *proposal* is worth implementing as written, given what already
exists.

## 3. Ground truth — what exists today

Inspected: `operations.ts` predicates, `screen.ts` action emission, generated output of all 4
apps (tasks / hr_service / work_auth / ledgerly), `plan.json`, validators.

### 3.1 Capability predicates (all already exist in `operations.ts`)

| Predicate | Location | Returns |
|---|---|---|
| `crudOperations(repo, entity)` | `operations.ts:39-46` | `{create?, update?, delete?}` from repo ops |
| `hasFullCrud(repo, entity)` | `:49-52` | create+update+delete present |
| `crudFormTargets(ir)` | `:73-85` | entities with create+update (delete carried) |
| `quickDecisionTargets(ir)` | `:101-122` | LM6 per-row status-decision targets (the enablement precedent) |
| `hasAudit(ir)` / `isAudited(ir, entity)` | `:381-387` | any / per-entity `audited: true` |
| `resolveExport(ir, screen)` / `hasExport(ir)` | `:408-432` | resolved `export:` on a list screen |

### 3.2 What the generated apps actually render today

| Action | Status today | Decided by | Where |
|---|---|---|---|
| **Edit** (detail) | ✅ shipped, inline `IconButton(Icons.edit)` | `canEditCreate` from `crudTarget` | `screen.ts:726-729` |
| **Delete** (detail) | ✅ shipped, inline `IconButton(Icons.delete)` — **no confirm dialog** | `canDelete` from `crudTarget` | `screen.ts:726-729` |
| **Delete** (list row, LM6) | ✅ shipped inline | `quickDecisionTargets` | list row trailing |
| **Export CSV/JSON** (list) | ✅ shipped inline `IconButton(Icons.download)`, bloc-only | `resolveExport` + `s.type === "list"` | `screen.ts:683-721` |
| **Audit** | ⚠️ **unreachable** — `AuditLogScreen` + `/audit-log` route ARE generated (hr_service), but **no button/entry point anywhere** | `[audit]` gate emits screen | `core/audit_log_screen.dart`, `router.dart` |
| **Save** (form) | ✅ shipped as in-body `PrimaryButton('Create'/'Save')` — **no extended FAB** | CRUD form target | `crud_form.ts` |
| Overflow/"…" menu | ❌ absent (no `PopupMenuButton`/`more_vert` anywhere) | — | — |
| `patterns.actions` in plan.json | ❌ absent | — | — |

### 3.3 Plan / gate state

- `plan.json` `patterns` per app: tasks/hr_service/work_auth `{scroll, search}`; ledgerly
  `{scroll, search, shell}`. No `actions` key anywhere.
- Validators already exist and are green: `[export]` (validate.ts:596), `[audit]`
  (validate.ts:570 — asserts `core/audit.dart` AND `core/audit_log_screen.dart` exist when audited
  entities exist). No `[actions]` gate.

### 3.4 Round-2 edit #3 (binding)

The v1 `ActionSpec` is frozen as: `{kind, label, icon, enablement, confirm?, presentation:
inline|overflow|primary}` — **`params` is dropped** (v1 has no parameterized actions).
`presentation` replaces ad hoc "…"-menu threshold logic.

## 4. Questions

1. Does the ActionSpec layer replace any *existing* behavior, or is it purely additive?
2. Is the Delete confirm dialog a real UX gap worth a slice?
3. Is the Audit action the true missing capability (screen generated but unreachable)?
4. Does the extended-FAB Save contradict the existing in-body PrimaryButton?
5. Is the overflow grouping (>2 actions → "…") actually reachable with the 4-kinds action set on
   the current samples?
6. Can every decision stay deterministic (no new heuristics, no new IR fields)?

## 5. Evidence

### 5.1 Existing emission is already capability-driven (deterministic home)

- Detail Edit/Delete: `screen.ts:246-247` (`canEditCreate = !!crudTarget; canDelete =
  !!crudTarget?.delete`) → `appBarActions` at `:726-729`. This is exactly the "no always-show"
  contract §6 demands — **the Delete/Edit action decision already has a deterministic home**.
- Export: `resolveExport` → `exportButtons` at `:683-721`, bloc-only guard at `:692`.
- The proposal's `actionsFor` selector would be the *third* way to express some of these
  decisions (crudTarget-based inline blocks today, quickDecisionTargets for LM6, resolveExport
  for export) — risk of **fragmenting one decision across three homes** if not consolidated.

### 5.2 Delete confirm dialog — a real gap, small cost

Today a delete is one tap, immediate, unrecoverable. There is no `showDialog`/`AlertDialog`
anywhere in generated detail screens. This is the clearest *user-visible* improvement P4 offers.

### 5.3 Audit — the true missing capability

`hr_service` declares `LeaveRequest` audited; the generator emits `core/audit.dart` +
`core/audit_log_screen.dart` + `/audit-log` route, and `[audit]` gate passes — but **no UI
anywhere navigates to `/audit-log`**. An audit trail you cannot open is invisible. P4's Audit
action (detail "…" menu → `/audit-log`) closes exactly this.

### 5.4 Save / extended FAB — contradiction with existing pattern

Contract §6 says Save = "extended FAB on form". But the form already has an in-body
`PrimaryButton('Create'/'Save')` (`crud_form.ts:543-552`) wired to the same submit logic. An
extended FAB would render **two** save affordances on one form. This is a real design conflict
the spike must resolve, not paper over.

### 5.5 Overflow grouping — likely unreachable on current samples

Max detail-screen action set today: Edit + Delete (+ Audit) = 2–3. "…" menu at >2 would only
fire for an audited + full-CRUD detail (hr_service LeaveRequest: Edit+Delete+Audit = 3) — exactly
one screen in one app. The `presentation` field is still correct as a *declared* decision, but
the `overflow` branch would have little-to-no exercised coverage.

## 6. Semantic contract

Every action kind maps 1:1 to an existing closed `operations.ts` predicate — no new IR fields,
no new heuristics:

| Action | Semantic source |
|---|---|
| Export | `resolveExport(ir, screen)` resolves on a list screen |
| Delete | `crudTarget.delete` present (detail) / `quickDecisionTargets` (row) |
| Audit | `isAudited(ir, entity)` true |
| Save | `crudFormTargets` create+update (extended FAB **or** existing button — see §12) |

## 7. Determinism analysis

- Inputs: IR (entities/repositories/screens) + `operations.ts` predicates — all pure, closed.
- The `actionsFor` selector would be pure `(screen, entity, repo, ir) → ActionSpec[]`, same
  posture as `scrollFor`/`searchTargets`. Plan payload `patterns.actions` path-keyed.
- No randomness, no time, no env, no implicit naming. Determinism risk: none beyond keeping the
  decision in ONE selector (see §5.1 / §11 — do NOT have a third inline copy in screen.ts).

## 8. Ownership analysis

- **Selector**: `composition.ts` gains `actionsFor` (4th selector beside shell/search/scroll).
- **Icon map**: extend `KNOWN_SHELL_ICONS` stem-map pattern (`composition.ts:79-88`) with a small
  action→icon map (Export→download, Delete→delete_outline, Audit→history, Save→save). Collision
  allowed by design (C13).
- **Detail "…" menu / inline actions**: `screen.ts` `appBarActions` block — BUT this is the same
  insertion point P1/P2/P3 already own. Must extend the existing block, never fork it (§11).
- **Confirm dialog**: `screen.ts` Delete emission (wrap the delete `onPressed`).
- **Extended FAB**: `crud_form.ts` — new insertion point (roadmap hasn't touched it yet).
- **`[actions]` gate**: `validate.ts` — re-derive via `actionsFor`, diff plan + scan screens.

## 9. Failure modes

| Case | Outcome |
|---|---|
| No applicable capability on a screen | `actionsFor` returns `[]` → no actions rendered (byte-identical) |
| Unknown/5th action kind | Not possible — closed vocabulary; adding one = new `operations.ts` predicate + contract update (C16) |
| Audit without auth | `[audit]` gate already fails first (needs `attributes.auth`) |
| Export unresolved | `[export]` gate fails (existing) |
| Detail with 0 or 1 actions | `presentation: inline` |
| Detail with 3+ actions | `presentation: overflow` → "…" menu (only hr_service LeaveRequest would exercise) |
| Delete with no confirm scope | confirm dialog default ON for Delete (destructive), OFF for others |

## 10. Architecture impact

Classification: **B (interaction/state)** — adds a confirm dialog (interaction) and an entry
point to an existing screen (navigation). NOT pure presentation. Explicitly does **not** cross
into E (runtime authorization): build-time capability only (C10) — "action rendered ≠ action
permitted"; a future auth spike adds a guard around the action, never replaces it.

## 11. Cost / complexity

| Dimension | Assessment |
|---|---|
| Generator complexity | M — `actionsFor` selector + `screen.ts` extension + `crud_form.ts` FAB + `[actions]` gate |
| IR/schema changes | None |
| Golden churn | Low (only screens gaining action UI: audit entry, confirm dialog don't change at-rest pixels; FAB might) |
| CDP verification | Required (navigation + dialog + overflow) |
| Determinism risk | Low if decision stays in ONE selector |
| **Biggest risk** | **Fragmenting existing action decisions** (crudTarget inline today, quickDecisionTargets, resolveExport) across a new selector — must consolidate, not add a 3rd source of truth |

## 12. Findings

1. **P4 is 60% already shipped** (Edit/Delete/Export are capability-driven with deterministic
   homes). The genuinely new, valuable parts are narrow:
   - **(a) Delete confirm dialog** — real UX gap, small.
   - **(b) Audit entry point** — audit screen exists but is unreachable; one button fixes it.
   - **(c) `[actions]` gate + plan `patterns.actions`** — the "decision as data" hardening for
     actions (matches S-CTX/P2/P3 posture).
   - **(d) overflow "…" grouping** — correct as a declared `presentation`, but only 1 sample would
     ever exercise it.
2. **Save-as-extended-FAB contradicts the shipped in-body PrimaryButton** — two save affordances
   on one form. The proposal's FAB branch should be **dropped from v1** (keep the existing button;
   the `Save` kind documents that write-capability is the semantic source, but renders via the
   existing button, not a second FAB).
3. **`params` is correctly dropped** (round-2 edit #3) — no parameterized action exists.
4. The 4-kinds closed vocabulary is **already true by architecture** (C16) — the spike formalizes
   it into the `ActionSpec` union, no new predicates needed.

## 13. Decision

**MODIFY** — adopt P4 in a reduced, consolidation-first scope:

- **M4a.1 (this slice):** `actionsFor` selector in `composition.ts` as the **single** action
  decision, feeding (i) the Delete confirm dialog, (ii) the Audit entry point on audited details,
  (iii) `patterns.actions` + `[actions]` gate. Edit/Delete/Export keep their existing emission but
  are **re-derived through `actionsFor`** so there is one home, not three. `Save` kind documents
  write-capability in the schema but does NOT add a second FAB (keep the existing PrimaryButton).
- **M4a.2 (folded into same slice):** overflow "…" menu emitted when a detail's action set is
  >2 — exercised by hr_service LeaveRequest (Edit+Delete+Audit). `presentation` is a declared
  per-action decision, never a threshold guess in screen.ts.
- **Deferred:** extended-FAB Save (conflicts with existing button; revisit if/when D2's composed
  actions land), parameterized actions (`params` — no v1 need), runtime authorization (C10, out
  of scope, future auth spike).

Rationale for MODIFY over ADOPT-as-written: the proposal as written would add a second Save
affordance (regression) and a third action-decision home (fragmentation). The reduced scope
delivers all real value (confirm dialog, audit entry, gate, one selector) with byte-identical
output for capability-absent screens.

## 14. Recommended implementation (from the decision, not the hypothesis)

1. `composition.ts`: `ActionKind = 'export'|'delete'|'audit'|'save'`; `ActionSpec {kind, label,
   icon, confirm?: boolean, presentation: 'inline'|'overflow'|'primary'}`; `actionsFor(screen,
   entity, repo, ir)` — single decision source; small action→icon stem map.
2. `plan.ts`/`gen_context.ts`: `patterns.actions` + `ctx.actions` (screenPath-keyed).
3. `screen.ts`: re-derive Edit/Delete/Export via `actionsFor`; wrap Delete in a confirm dialog;
   emit Audit action on audited details → `/audit-log`; emit overflow "…" menu when
   detail action count > 2. Byte-identical for capability-absent screens.
4. `crud_form.ts`: NO new FAB (keep PrimaryButton). `Save` kind exists in the type only.
5. `validate.ts`: `[actions]` gate — re-derive via `actionsFor`, diff `patterns.actions`, scan
   screens (positive set renders, null set doesn't; Delete has confirm; no second save FAB).
6. Verify: typecheck; 13/13 IRs; negative control (stale plan entry / stripped Audit button);
   CDP (delete confirm appears + cancels/confirms, audit entry → log screen, no overflow at
   320/390/768/1280); byte-identical wizard/null-set proof.

## 15. Rejected alternatives

- **ADOPT as written** — rejected: adds a conflicting second Save affordance + a third action
  decision home.
- **REJECT P4 outright** — rejected: the confirm dialog and audit entry point are real,
  low-cost gaps with shipped-but-unreachable UI (audit) / unrecoverable deletes.
- **Save-as-FAB only, remove PrimaryButton** — rejected: churns every form's goldens and tests
  for no user benefit; the in-body button is standard and works.
- **New IR field for action enablement** — rejected (SPIKE_PROTOCOL §13): enablement is derivable
  from existing predicates; a schema field would be convenience, not need.

## 16. Open questions

- Does the owner want Delete's confirm dialog to be skippable (destructive with a "Delete anyway"
  state) or always require confirmation? Default: always confirm.
- Should the Audit entry point be on the detail screen, or also a list-level action? Default:
  detail (per contract §6 "detail … menu").

## 17. Follow-up

- Decision brief MD+PDF (mermaid pipeline/sequence, shaded regions) → owner on Telegram.
- Implementation slice(s) after owner go-ahead; verify per §14.6.
