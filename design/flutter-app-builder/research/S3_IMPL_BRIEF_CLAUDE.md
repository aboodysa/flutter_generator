# S3 implementation brief — procedural asset-resolution ladder (no AI)

**From:** Orchestrator (zen) — **To:** Claude Code (implementer, Mac) — **Date:** 2026-08-18
**Status:** dispatch-ready. **Source of truth:** `SPIKE_S3_REPORT.md` — implement **§14.1–14.6**
exactly as the report specifies. Read the whole report first (decisions D1–D5, findings, rejected
alternatives). One pure-selector slice; S4 (library+manifest) is a separate slice — do NOT build it.

**Read first, in order:** SPIKE_S3_REPORT.md (full), SPIKE_S2_REPORT.md §14.2 (the `sectionsFor`
template), S2_HARDENING_BRIEF_CLAUDE.md (the `[sections]` gate pattern just shipped), the S6 slice-3
`[asset-ref]`/`[aspect-ratio]` gates you built vacuous (validate.ts — flip ON in §14.5), and
`VLM_DESIGN_TO_IR_CONTRACT_V2.md` §3/§5 (the `:44` never-rule: no paths/URLs/numbers for imagery).

> **NOTE — §14.2 (imagery enum flip) is OWNER-GATED.** The orchestrator asked the owner whether to
> flip `visualStyle.imagery` ON now (SPIKE_S3_REPORT §16). Do ONE of:
> - Owner replied **A (flip)** → implement §14.2 fully.
> - Owner replied **B (keep closed)** or answer pending → implement §14.2 as: keep `imagery`
>   closed-out (no IR field), but still build every other §14 item; `patterns.assets` derives from
>   decided `sections[]` semantics only.
> Check the orchestrator's dispatch note for the owner's reply. If it is NOT stated in your prompt,
> assume B (keep closed) and note it — the selector/wiring/gate/proof are identical either way.

## Objective

Ship S3's procedural rung as ONE additive deterministic slice: a pure `assetFor` selector that
decides every imagery-role to a procedural token-only `AssetSpec`, `<ctx.assets>` threaded through
the existing plan/wiring, a `[assets]` gate, and the S6 slice-3 asset gates flipped ON. No scoring/
arch/DI/routing/persistence changes. No AI branch (S7 stays a stub).

## The slice spec (SPIKE_S3_REPORT §14 — implement these six steps)

**14.1 Selector (`composition.ts`)** — `interface AssetSpec { role; kind:
"icon"|"gradient"|"shape"|"placeholder"|"omitted"; tokenRef?; icon? }` + `assetFor(screen, ir):
AssetSpec | null` + `assetTargets(ir)`, mirroring `sectionsFor`/`sectionsTargets`
(`composition.ts:500-515`). Mapping tables (closed, no paths/URLs/numbers):
`hero/promoBanner → {kind:"gradient", tokenRef:"AppColors.primary"}` (consumed as the existing
AppHeroBanner gradient), `productGrid → {kind:"omitted"}` (explicit, not silence), store-logo →
`{kind:"shape", tokenRef:"AppAvatar"}`.

**14.2 Imagery flip — ONLY IF owner answered A** (`types.ts` + `validate.ts`) — un-comment
`imagery?: VisualStyleValue<VisualImagery>` (closed enum `none|commercial|illustrative|photographic`),
amend `[visualIntent]` (d) to admit the closed set + reject non-enum, update the S1 negative control
to a positive + add a determinism case. If B, skip this step.

**14.3 Wiring (`index.ts`/`plan.ts`/`gen_context.ts`)** — `assetTargets` once per run
(index.ts:919-937 precedent) → `ctx.assets` → `assetsByPath` re-key (index.ts:801-822) →
`patterns.assets` additive spread (writePlan; plan.ts:60-68).

**14.4 Renderer (`screen.ts`)** — sections branch consumes `ctx.assets` verbatim at existing call
sites (hero :443-445, grid :446-481); **never re-derives** (the `[visualIntent]` FIX-6 scan
validate.ts:929-950 guards this).

**14.5 `[assets]` gate (`validate.ts`)** — mirror `[visualIntent]`/`[sections]`: re-derive+diff
`patterns.assets` (incl. null), closed-kind enum, token-only/icon-only scan, provenance reuse. Then
**flip the S6 slice-3 `[asset-ref]` + `[aspect-ratio]` gates ON** (they must now be load-bearing
against the new `patterns.assets`, not vacuous).

**14.6 Proof** — keemart + one sections app with imagery declared (if A): generate → validate →
`flutter test --update-goldens` → squeeze 320/390/1400 green → determinism re-run byte-identical →
negative control (imagery non-enum value → abort). If B: keemart as-is + the `[assets]` gate proof.

## Constraints
Additive only. No deletions. No weakening of existing gates. Follow the exact "single-owner,
never-re-derive" convention (S1 `[visualIntent]` FIX-6). `AssetSpec` carries NO path/URL/number
(the `:44` never-rule). Small commits, one logical slice each, pushed to origin/master. Do NOT
touch scoring, states/routing/DI, or the S7/approval machinery.

## Verification (all mandatory, report exact output)
1. `npm run typecheck:builder`.
2. `npx jest test/s1_visual_intent.test.ts` — 20/20 (or updated count if §14.2 landed; state it).
3. `npm test` — full suite green.
4. Regenerate + validate keemart: `index.ts` then `validate.ts` (all gates PASS incl. new
   `[assets]`, `[asset-ref]`, `[aspect-ratio]`). Squeeze tests green for generated apps.
5. Determinism: two fresh keemart regens `diff -r` byte-identical.
6. Negative controls actually bite: imagery non-enum → abort (if §14.2); a deliberate
   path/URL/number in a tokenRef → `[assets]` FAIL (prove teeth without breaking real apps).
7. Report ≤12 lines: per-step commit hashes, gate diff before/after, golden churn list, negative
   control outputs, determinism proof, and which §14.2 branch (A/B) you implemented.