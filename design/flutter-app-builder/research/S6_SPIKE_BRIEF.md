# S6 — No-vision-judge defect-coverage — SPIKE brief (remote opencode agent)

**From:** Orchestrator (zen) — **To:** remote opencode agent (tracematrix, germany3) — **Date:** 2026-08-18
**Source of truth:** `design/flutter-app-builder/research/SPIKE_PROTOCOL.md` (binding — read it FIRST).
**Spike plan:** `SPIKE_PLAN.md` + `VISUAL_GENERATION_REVIEW.md` §18 REJECT, §5-Modified, **§6 S6** (P0, lines ~111-115).
**Working copy:** `/root/fg-p5` on this host, freshly synced to current master.

## What this is

A RESEARCH SPIKE (read-only, no commits, implement-last). You prove whether the *intent* of the §18
"Visual Analyzer" defect list is **fully covered deterministically** — i.e. every defect maps to either
an existing/near-term validator or a human-baselined golden pixel-diff — or whether one defect genuinely
needs semantic vision. You CLOSE the decision. You do NOT write generator code.

## The hypothesis (VISUAL_GENERATION_REVIEW §S6, lines 111-115 — must be falsifiable)

> Every defect the proposal's "Visual Analyzer" targets (overflow, clipping, alignment, spacing,
> typography, contrast, aspect-ratio, missing-asset, RTL, component-consistency, hierarchy) maps to
> either an existing/near-term **deterministic validator** or a **human-baselined golden pixel-diff** —
> no case requires semantic image understanding.

**Decision criteria (from the plan):** ADOPT (validators+golden suffice) if each defect maps to a
concrete check. ESCALATE/keep-for-research any single defect that provably needs semantic vision —
that becomes a product-owner call (is it worth a non-deterministic path?).

## Grounding you must read first (read-only)

- `VISUAL_GENERATION_REVIEW.md` — §18 (lines ~72-82), §5-Modified (lines ~86-99), §6 S6 (lines ~111-115),
  §7 roadmap slotting (lines ~150-174), §14 reference to the validator layers listed at lines 75-82.
- REAL validator source (cite file:line): `builder/src/validate.ts` (the orchestrator gate surface —
  enumerate the actual `[gates]` today: head the gate list in `main()`, e.g. platform/determinism/
  headers/secrets/forbidden-idioms/architecture/oracle/strategy-fidelity/money/datepicker/verdict/
  split/tenant/symbols/auth/attachment/budget/audit/export/l10n/theme/outbox/shell/search/scroll/
  actions/states/visualIntent/lockfile/timestamp/plan-determinism), `builder/src/validators/*` if any
  (overflow/contrast validators referenced as §14.4.x), `layout.ts`/`overflow` checks, `contrast.ts`
  if present, `design/flutter-app-builder/DESIGN.md` §14 (validator layers), §9.4 (LLM judge = triage
  only), §15 (golden workflow), §16 if referenced.
- Existing golden tooling: `flutter test --update-goldens` + the golden_test generator
  (`builder/src/generators/test/*`), plus `tools/overflow/overflow_scan.py` and lessons in
  `new_chrome_ext/tools/FLUTTER_TESTING_LESSONS.md` if reachable from this host.

## Investigation questions to answer (each evidence-grounded)

Build a **defect × coverage matrix**. For EVERY defect in the §18 list — overflow, clipping,
alignment, spacing, typography, contrast, aspect-ratio, missing-asset, RTL, component-consistency,
hierarchy — classify:

1. **Which deterministic state is it covered in today?** Map to the actual gate/validator function
   (file:line) or to the S1-style test we just codified (`test/s1_visual_intent.test.ts`), or to the
   golden pixel-diff workflow. Mark: EXISTS / NEAR-TERM (small deterministic validator) / GOLDEN-ONLY /
   NONE.
2. **For soft/impossible-to-script defects** (e.g. "visual hierarchy looks right", "alignment feels
   off", typography rhythm): is a **human-baselined golden pixel-diff** a sufficient deterministic
   gate? (The design's answer is yes — §15 — because the human owns the baseline and the diff is
   numeric.) Check that the repo's golden workflow is actually delta-checkable pixel-diff (not just
   "file exists"). Cite the mechanism (`matchesGoldenFile`).
3. **The one gap probe:** is there ANY defect on the list that can ONLY be caught by looking at a
   rendered image and judging semantics — i.e. where no concrete validator check and no pixel-diff
   baseline exists? If yes, name it precisely + what deterministic proxy would replace it (e.g.
   aspect-ratio from ImageSpec in IR, text elision from a max-lines/overflow check, RTL from
   Directionality + ltr matched test). This decides the verdict.
4. **What the Candidate deterministic additions would be** (spec NOT implement): for each
   NEAR-TERM/ NONE cell, propose the validator in one line (name, what it computes, where it plugs)
   as future slice candidates for the Mac implementer.

## Decisions you must CLOSE (with evidence)

- **D1 — Coverage verdict:** ADOPT (all defects deterministically covered — existing validators OR
  golden pixel-diff) vs ESCALATE (≥1 defect provably needs semantic vision — with a precise name and
  a proposed non-deterministic-but-gated path for the product-owner call). MODIFY acceptable if your
  evidence shows the defect list should be re-scoped (e.g. split one defect into goldens + validator).
- **D2 — Near-term validator candidates:** the concrete list (name + one-line spec) the Mac
  implementer should build to close every NEAR-TERM/NONE cell, with priority (which cell is worth the
  most). Distinguish "nice" from "gate-worthy".
- **D3 — Golden-diff sufficiency:** confirm/deny that the existing golden workflow is a real
  pixel-diff gate (numbers + mechanism), and what one improvement (if any) makes it a trustworthy
  baseline gate (e.g. baseline approval workflow, tolerance policy, "golden drift review" step).
- **D4 — Interaction with S1's new tests:** does the S1 `test/s1_visual_intent.test.ts` + the
  `[visualIntent]` gate already close any §18 cells (hierarchy, component-consistency, corner-radius
  language)? Cite which.

## Constraints (SPIKE_PROTOCOL non-negotiables)

- READ-ONLY. No commits, no edits, no builds, no `npm`/ts-node/Flutter on this 1GB box. Investigate +
  prove + decide + write the report — nothing else.
- Failure modes mandatory per decision (what would falsify it).
- Do NOT implement validators, do NOT do S2/S3/S4/S5/S7 or S-DEEPLINK. S6 ONLY.

## Deliverable (§17 report)

`design/flutter-app-builder/research/SPIKE_S6_REPORT.md` in YOUR clone, same structure/format as
`SPIKE_S1_REPORT.md` + `SPIKE_S_HERMETIC_REPORT.md`. Mandatory sections: hypothesis + corrected
premise (if any); ground truth (file:line); the **defect × coverage matrix** (every §18 defect × exists/
near-term/golden/none + mechanism); investigation answers (Q1-Q4); decisions D1-D4 CLOSED (verb +
evidence); rejected alternatives; implementation-slice spec (validator candidates D2, prioritized,
one-line each); risks/failure modes; open questions (owner-call items). In your chat summary: the 4
decision verbs + the coverage matrix one-liner (~6 lines total). Orchestrator fetches the report back.