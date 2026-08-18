# S3 — Deterministic asset-resolution ladder (no AI) — SPIKE brief

**From:** Orchestrator (zen) — **To:** remote spike lane (germany3, DeepSeek Flash Free)
**Status:** dispatch to fresh session — read-only research per SPIKE_PROTOCOL
**Source of truth (read first, in order):**
1. `design/flutter-app-builder/research/SPIKE_PROTOCOL.md` (binding execution rules)
2. `design/flutter-app-builder/research/VISUAL_GENERATION_REVIEW.md` §S3 (lines 121-124) + §8.1/§2.3/§12
3. `design/flutter-app-builder/research/VLM_DESIGN_TO_IR_CONTRACT_V2.md` §3 AssetRequest + §Asset Planner (lines ~238-244)
4. `design/flutter-app-builder/research/SPIKE_S2_REPORT.md` §13 D3 (the AppHeroBanner/AppProductCard no-image stand-ins S3 unlocks)
5. `design/flutter-app-builder/HANDOFF.md` (current state)

Repo: `/root/fg-p5`. **Read-only — NO commits, NO edits, NO npm/ts-node/Flutter** (1vcpu/1gb box).
`git status` clean before and after; single untracked deliverable `SPIKE_S3_REPORT.md` under
`design/flutter-app-builder/research/`. Headers cite real file:line at HEAD.

## 1. Hypothesis

> For N sample visual roles, the asset-resolution ladder **existing project asset → declared
> library → procedural gradient/shape** resolves every role without invoking any external generator
> (or AI), and each resolution is a **pure function of the IR + manifest**. The AI branch (`generated`)
> stays stubbed (carved out per §5/§7 accept + trust boundary §12/§2.2).

**Decision criteria (`VISUAL_GENERATION_REVIEW.md:124`):**
- ADOPT if all sample roles resolve deterministically and the arch-linter stays clean.
- MODIFY if the library schema is insufficient (specify the exact schema change).
- REJECT if a role can only be satisfied by AI generation (→ defer to S7).

## 2. The ladder to ground (contract §3, `VLM_DESIGN_TO_IR_CONTRACT_V2.md:238-244`)

`VLM → AssetRequest → Asset Planner → existing project asset → declared library → procedural
gradient/shape → (S7, post-v1) AI + human approval + content-hash + manifest + lockfile`

`AssetRequest {semanticRole, style, aspectRatio, background}` (:44 rule: never emit a file/URL for
imagery; emit the AssetRequest; resolution is the ladder's job).

## 3. Questions (answer all with file:line evidence)

**Q1 — Vocabulary.** What is today's `AssetRequest`/asset vocabulary in the repo? Is it a type in
`types.ts` / schema / plan, or only a contract prose concept? Does the IR have ANY imagery/asset
field S3 can key off (e.g. `screen.sections[].hero` with no image slot — confirmed in SPIKE_S2_REPORT
§13 D3)? Exact absence/presence per file:line.

**Q2 — Ladder stages feasibility.** For each of the 3 deterministic stages, what does it take to
emit from the generator today?
- (a) **existing project asset** — what assets does the generator already emit (fonts, icons —
  check `generators/project.ts`, `generators/web.ts`)? Can a semanticRole map to one of these with
  zero new machinery?
- (b) **declared library** — does a "library" concept exist (a per-app or shared asset manifest)?
  If not, what's the minimal additive shape (JSON? IR field? pubspec assets entry?)? Does `index.ts`
  have a manifest/lockfile pattern to ride (see S-HERMETIC `[lockfile]` gate)?
- (c) **procedural gradient/shape** — S2 just spec'd `AppHeroBanner` with `LinearGradient(
  colors:[AppColors.primary, …withValues(alpha:.85)])` as a NO-IMAGE stand-in (`components.ts:153`).
  Is that already the procedural stage's rendering home? What shapes (gradient, border, icon, chip,
  placeholder box) can be composed from existing registry atoms + tokens with no raster?

**Q3 — Resolution is a pure function.** Where does a `resolveAsset(ir, role) → {kind, source?,
tokenSpec?}` selector slot into the existing single-owner selector family (composition.ts:
`shellFor/searchFor/scrollFor/actionsFor/statePlacementFor/visualFor` at :112/:156/:211/:293/:357/
:435)? Can it return a decided `AssetSpec` that screen.ts consumes verbatim (the S1/S2 "never
re-derive" rule)? What does the plan.json surface look like (`patterns.assets`? additive slot)?

**Q4 — Manifest + determinism (S4 groundwork).** What would a per-app asset manifest + lockfile
entry need so a second run is a pure cache hit and regeneration stays byte-identical? Check the
S-HERMETIC `[lockfile]`/`[determinism]` gates (`validate.ts`) and `pubspec` emission — where do
declared assets get registered so `flutter build` finds them (pubspec `flutter.assets`)? Zero-cost
answer: is a manifest even needed for v1 or do procedural/token assets need no file at all?

**Q5 — Trust boundary / S7 carve-out.** Confirm the AI branch is fully external today (no AI image
code path in builder/src). Where exactly would the S7 `generated` stage hook (a stub, gate-blocked,
never invoked)? Cite `approve.ts`/provenance machinery as the future gate (S1 `requiresApproval`
pattern, `test/s1_visual_intent.test.ts` trust-boundary cases).

## 4. Method

1. Read the sources above; grep the tree for every asset/imagery/AssetRequest/Image reference.
2. Identify the N sample visual roles from the contract's worked examples (hero banner, product
   card image slot, store logo/avatar — `VLM_DESIGN_TO_IR_CONTRACT_V2.md:249,296-307`) and map each
   to a ladder stage.
3. Ground every claim in file:line. No scratch generation (box too small; forbidden by brief).
4. Write `SPIKE_S3_REPORT.md` (§17 format) with status/hypothesis/ground-truth table/Q&A/evidence/
   semantic contract/determinism/ownership/failure-modes/arch-impact/cost/**decisions CLOSED with one
   verb each (ADOPT/MODIFY/DEFER/REJECT/SPLIT/ESCALATE)** + rejected alternatives + open owner calls
   + follow-up. ~6-line summary at top.

## 5. Deliverables

- `design/flutter-app-builder/research/SPIKE_S3_REPORT.md` (untracked, single file).
- ≤4-line summary of the verdict(s) in the final chat message.
- Do NOT push/commit; do NOT send Telegram (token lives on the Mac; delivery handled by the
  orchestrator). Report the file path when done.

## 6. Guardrails

Read-only. No commits. No builds. No network calls to external generators/AI. Cite file:line.
Closed decisions with evidence. If the report would require a code edit to prove something, note
the edit + leave it to the implementer slice (spikes end in decisions, not implementation).
