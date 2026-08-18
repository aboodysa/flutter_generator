# S1 — VisualIntent fragment — SPIKE brief (remote opencode agent)

**From:** Orchestrator (zen) — **To:** remote opencode agent (tracematrix, germany3) — **Date:** 2026-08-18
**Source of truth:** `design/flutter-app-builder/research/SPIKE_PROTOCOL.md` (binding — read it FIRST).
**Spike plan:** `design/flutter-app-builder/research/SPIKE_PLAN.md` + `VISUAL_GENERATION_REVIEW.md` **§S1** (P0, lines ~106-109).
**Contract it must stay consistent with:** `design/flutter-app-builder/research/VLM_DESIGN_TO_IR_CONTRACT_V2.md` (read §1.5, §2.2, §2.3, §6).
**Working copy:** `/root/fg-p5` on this host, already synced to `e6df6a9`.

## What this is

A RESEARCH SPIKE (read-only, no commits, implement-last). You investigate whether a typed
`VisualIntent` fragment is sufficient and sound, and you CLOSE the decision.
You do NOT write generator code (implementation happens later on the Mac by Claude).

## The hypothesis (from VISUAL_GENERATION_REVIEW §S1, must be falsifiable)

> A **closed-enum** `VisualIntent {density, hierarchy, cornerRadius, personality, emphasis}` added to
> `ScreenModel` is sufficient to make the §5.2 scoring function emit *measurably different*
> deterministic compositions for 3 sample screens, introducing **zero** new raw literals and staying
> byte-identical on re-run.

**Hard rule (ChatGPT strengthening, already adopted into the architecture):**
`VisualIntent` must NEVER directly select a widget or asset. It feeds the deterministic scoring function
→ composition strategy → component registry. `personality: friendly` cannot mean "use FriendlyCard";
it must bias the scoring toward rounded cards / generous spacing from existing tokenized components.

## Grounding you must read first (read-only)

- `VISUAL_GENERATION_REVIEW.md` — §S1 (+ §2 verdict table rows for §3/§12, §5 Modified, §6 S2/S5, §7 roadmap slotting).
- `VLM_DESIGN_TO_IR_CONTRACT_V2.md` — §2.3 `screen.visualStyle` (S1 proposal: closed enums, `emphasis` is a `targetId`), §6 schema-grounding table, §7 acceptance checks (provenance on every inferred value). The spike's fragment must MATCH the contract's `visualStyle` shape (they're the same thing), not diverge.
- REAL source (cite file:line): `builder/src/types.ts:157` (`AppAttributes` — `density` already EXISTS; `brandSeedColor`, `themeMode`, `responsiveness`, `locale` exist), `types.ts:265` (`ScreenModel`), `builder/src/scoring.ts` (§5.2 the scoring function — how decisions are weighed today), `builder/src/composition.ts`, `builder/src/generators/screen.ts`.

## Investigation questions to answer (each evidence-grounded)

1. **Which fields are real vs redundant?** `density` already exists at `AppAttributes.density`
   (types.ts:159) AND the contract's v2 shape moves to `screen.visualStyle`. Decide: does the
   fragment live on `AppAttributes` (app-level, like D1) or `ScreenModel` (per-screen, like the
   contract's `visualStyle`)? Recommend the per-screen fragment (contract v2 §2.3 shows `screen:
   visualStyle:`) — verify it's additive to `ScreenModel`, and confirm `density` moves/copies
   without breaking existing IRs (byte-identical for IRs that never set it).
2. **Closed enums — root set.** For `hierarchy {soft|balanced|strong}`, `cornerRadius
   {sharp|soft|rounded|pill}`, `personality {professional|friendly|premium|playful|minimal}`,
   `imagery {none|commercial|illustrative|photographic}` — check the current scoring/composition
   vocabulary to see which enums actually have a deterministic mapping today and which are pure
   vocabulary with no renderer effect yet. This is the "underdetermined field" risk (G6.1): a
   field that never changes output = REJECT/MODIFY signal.
3. **`emphasis` as `targetId`** (contract v2 §2.3): an `emphasis` that references a `sections[].id`
   — but `sections[]` (S2) does NOT exist yet. Decide the ORDERING problem: does S1 introduce ONLY
   the closed-enum `visualStyle` with `emphasis` deferred to S2 (when sections exist), or an
   `emphasis` as an enum-of-semantic-roles for now (e.g. `primary_hero|product_grid|order_status`
   resolved via existing composition)? Recommend the least-future-rewriting option.
4. **Scoring effect — measurable difference.** Read `scoring.ts`; propose (not implement) exactly
   how each enum feeds a score (e.g. density→spacing scale, hierarchy→section-order weight,
   cornerRadius→radius token set, personality→bias weights). What are the acceptance criteria for
   "measurably different" in the future implementation slice? Suggest 3 concrete sample screens
   (from the existing IRs: `tasks` = form-heavy utility, `hr_service` = professional dashboard,
   a commerce-type home) that would produce different compositions.
5. **Provenance fit.** The v2 contract requires `{origin,confidence,evidence,requiresApproval}` on
   every inferred visualStyle value. Check `builder/src/provenance.ts` (exists — used by the
   semantic lane): does the existing provenance/approval machinery already cover NEW IR fields, or
   must the fragment carry its own envelope? This decides whether validation of visualStyle values
   needs new gate machinery or reuses provenance stamps.

## Decisions you must CLOSE (with evidence)

- **D1 — per-screen vs app-level:** where the fragment lives (`ScreenModel` per contract, or app attributes). 
- **D2 — field set:** which enums are in v1 (ADOPT/MODIFY), which are underdetermined today (defer → S2), and confirm `density` handling.
- **D3 — emphasis:** targetId-now vs semantic-role-enum-now (ordering with S2).
- **D4 — provenance:** reuse existing provenance.ts vs fragment-carried envelope (and what `[visualIntent]` validation gate the implementer would add).

## Constraints (SPIKE_PROTOCOL non-negotiables)

- READ-ONLY. No commits, no edits, no builds, no `npm`/ts-node/Flutter on this 1GB box. Investigate + prove + decide + write the report — nothing else.
- Failure modes mandatory per decision (what would falsify it).
- Do NOT implement the fragment. Do NOT do S2/S3/S4/S5/S6/S7 or S-DEEPLINK. S1 ONLY.

## Deliverable (§17 report)

`design/flutter-app-builder/research/SPIKE_S1_REPORT.md` in YOUR clone, same structure/format as
`SPIKE_S_HERMETIC_REPORT.md`. Sections: hypothesis + corrected premise (if any), ground truth
(file:line), investigation answers (Q1-Q5), decisions D1-D4 CLOSED (ADOPT/MODIFY/REJECT/DEFER +
evidence), rejected alternatives, implementation-slice spec for the Mac implementer
(fragment shape + scoring-to-score mapping + `[visualIntent]` gate + verification commands),
risks/failure modes, open questions. In your chat summary: the 4 decision verbs + 2-3 top evidence
lines (~6 lines total). Orchestrator fetches the report back.