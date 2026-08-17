# Review brief — Visual Screen Generation Proposal

**From:** Orchestrator (zen) — **To:** Claude Code (implementer) — **Date:** 2026-08-18
**Input document:** `design/flutter-app-builder/research/VISUAL_SCREEN_GENERATION_PROPOSAL.md` (owner's Arabic proposal, 21 sections). Saved verbatim.

## Task

**Review** the owner's proposal against the current generator design and the frozen roadmap (DESIGN.md). This is a REVIEW + PLANNING task, **NOT an implementation task** — you are not to write generator code today. Your deliverable is a decision document that the roadmap work will consume later.

For EACH of the 21 sections deliver a verdict using exactly one of:

- **ACCEPT** — already satisfied by the current architecture and/or should be adopted as-is into the roadmap as given.
- **MODIFY** — the intent is right but must be adapted to this project's architecture (say exactly how).
- **REJECT** — incompatible with a project non-negotiable (deterministic 0% LLM core, trust boundary, oracle gate, additive-only, small commits, generated-code ownership, SOLID composition). Say which non-negotiable it violates and why.
- **DEFER** — a good idea but out of scope of the current roadmap/SLC; belongs to a later phase. Say which later phase.

For every verdict cite the DESIGN.md section (§) that grounds it. There is no "undecided".

Use your Slice-2 working knowledge of the real architecture (the `IR → plan.json → generators(country/uk) → validate` pipeline; `composition.ts`, `screen.ts`, `validate.ts`, `types.ts`, gen_context, `[theme]` gate, `[states]` gate) as the ground truth of what exists today. Read `design/flutter-app-builder/DESIGN.md` again for the authoritative rules (§8 deterministic core, §9 oracle, §12 trust boundary / provenance stamps, §19 rule language, §25 roadmap & phases) and `AGENTS.md`. Cite real file/line for architecture claims where useful.

## Evaluation axes

1. **Fit with the deterministic core.** The proposal's core thesis — LLM produces *semantic visual decisions*, a deterministic compiler renders — is the project's own principle (§8). Where the paper already matches, say ACCEPT and point to the existing mechanism. Where it would smuggle non-determinism back in (e.g. LLM choosing raw pixels/coordinates, or any render-time randomness), classify REJECT/MODIFY.
2. **What exists vs what's new.** Distinguish: already implemented (e.g. theme/brand tokens from D1, RTL/l10n lane, responsive LayoutBuilder, state-aware emission from P5/D2 Slice 2) vs genuinely new capability (Visual Intent schema, Asset Planner + manifest, imagery/illustration pipeline, composition banners, visual QA/repair loop, goldens) vs aspirational (AI image generation, visual diff oracle).
3. **Cost/benefit per slice.** The proposal bundles many independent ideas. Your spike backlog must UNBUNDLE them.
4. **Trust boundary.** Any new asset-generation path that invokes an external generator (image AI) must preserve: provenance stamps, human approval gate, deterministic outputs recorded in the manifest, cache/versioning. Call out where the paper ignores this.

## Deliverable

Write `design/flutter-app-builder/research/VISUAL_GENERATION_REVIEW.md` containing (lean, mermaid allowed for pipeline diffs):

1. **Executive verdict** — 3–6 sentences: what you accept wholesale, what you reject and why, what this means for the roadmap.
2. **Verdict table** — one row per section (1–21): `Section | Verdict | Grounding (DESIGN.md § + real file/line) | Note`.
3. **Accepted** — the short list of ideas already satisfied by current code (no work needed ≠ new code); and the ideas accepted but requiring new roadmap work (each becomes a spike in §5 or a roadmap phase).
4. **Rejected** — each with the violated non-negotiable + a proposed compatible alternative (the project rule is "reject the mechanism, keep the validated intent", so always offer the compatible form).
5. **Modified** — each proposal adapted to this architecture in one paragraph.
6. **Spike backlog with priorities** — each spike as a numbered item with: title, hypothesis (precise, falsifiable), why now vs later, priority (P0 = must know before further UI-SLC work; P1 = valuable next-phase input; P2 = nice-to-have), suggested decision criteria (what evidence makes ADOPT/MODIFY/REJECT unambiguous per SPIKE_PROTOCOL §17). Keep each spike one-controversy-only (SPIKE_PROTOCOL: one hypothesis, one decision).
7. **Roadmap slotting** — where the accepted parts land relative to the current frozen plan (S-CTX → P3 → P4 → P5/D2 → S-HERMETIC): purely-after (post-v1) vs interleaved, with a one-line reason. Do not propose re-ordering the frozen plan; the current slices stay as contracted.

## Constraints

- Review + planning only. NO edits to `builder/src`, `apps/`, or generated code. The only file you may write is the review document (plus this brief already exists).
- Respect additive-only: create the review file, do not delete/move anything.
- Make ONE small commit with only the review file (message like `docs(research): visual generation review — accept/reject/spike backlog`).
- State your working assumptions on this channel's chat (a short "verdict summary" ≤10 lines) so the orchestrator can relay to the owner on Telegram.
- Do not touch P5/D2 Slice 2 state you already committed — your Slice-2 work stays exactly as you committed it.

## Acceptance criteria (you verify before reporting done)

1. Review file exists with ALL 7 sections filled (no blank "tbd" cells).
2. Every section 1–21 has exactly one verdict + a DESIGN.md § citation.
3. Spike backlog has ≥5 and ≤12 spikes, each one-controversy-only, each with P0/P1/P2 and decision criteria.
4. No generator/app code changed (`git status` shows only the review file + brief; if your Slice-2 work was committed before, it's untouched).
5. Exactly one small commit.
6. Chat-state summary ≤10 lines.