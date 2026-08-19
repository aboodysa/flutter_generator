# S3 Spike — Explanation for the Owner

**Deterministic Asset-Resolution Ladder (no AI)**

*Round date: 2026-08-18 · Source: `design/flutter-app-builder/research/SPIKE_S3_REPORT.md` (§17 format)*

---

## What S3 was about

When we generate a screen from an AI-produced design, the design may reference **images**
(hero banner, product card photo, store logo). S3 answered one question:

> Can the generator decide what to show in those image slots **deterministically — with zero AI,
> zero downloaded files** — and is each decision a pure function of the IR + manifest?

The proposed tool is an "asset ladder": **existing bundled asset → declared asset library →
procedural gradient/shape** (→ much later, AI). S3 tested each rung of the ladder against the real
code.

## Headline verdict: SPLIT

The ladder partially works **today**, and the rest is provably the **next slice's** job. Equal to:

| Rung | Verdict | Meaning |
|---|---|---|
| Rung 1 — existing bundled asset | **ADOPT with a limit** | Works only for **icon** roles (fixed `Icons.*` stems). No image files are ever emitted, so imagery slides down the ladder. |
| Rung 2 — declared asset library | **DEFER → S4** | Nothing like an asset library or manifest exists yet. Building it is S4's scope (schema + pubspec `assets` + content-hash manifest). |
| Rung 3 — procedural gradient/shape | **ADOPT now** | This is where every design role already resolves: hero banner → gradient, product card → card (slot omitted), logo → avatar shape. **Tokens only, zero raster. Already 80% shipped.** |
| Rung "(S7) AI-generated" | **ADOPT (stay disabled)** | No AI image path exists in the code; when it ever does, it is gated behind the existing human-approval + provenance machinery. A stub that never runs. |

**The key finding: the generator emits ZERO image files today, and v1 doesn't need any.** All three
sample roles (hero banner, product image slot, store logo) resolve to **procedural shapes on design
tokens** — the exact thing S2's AppHeroBanner / AppProductCard / AppAvatar already render. There is
**nothing to download, no file to register in pubspec, no manifest to lock.** So v1 ships with no AI
and no asset files at all — pure deterministic code.

## The 5 closed decisions

- **D1 · Vocabulary — MODIFY.** There is no `AssetRequest` type anywhere in the code (prose only).
  The ladder will key off the existing decided `sections[]` semantics instead of inventing a new
  free-form field (which would erode the closed-enum discipline).
- **D2 · Procedural rung — ADOPT.** AppHeroBanner's gradient + AppAvatar/AppStatusDot shapes are the
  rung-3 rendering home; S3's real work is a decision **selector + record**, not new widgets.
- **D3 · Existing-asset rung — ADOPT with limit.** Icon roles already map via fixed `Icons.*` maps.
- **D4 · Declared library + manifest — DEFER → S4.** No library concept; the lockfile pins
  dependencies, not assets. Separate slice, independent value. **Zero-cost finding: v1 needs no
  manifest** (procedural assets emit no file; existing determinism gates already make re-runs
  byte-identical).
- **D5 · Trust boundary / S7 — ADOPT.** `grep` proves no AI image code path exists. The `generated`
  kind stays a never-returned stub behind the existing approve/provenance envelope.

→ **Net: SPLIT** = procedural rung now (one pure-selector slice), library+manifest with S4. No role
requires AI → REJECT never fires.

## Why it matters (what S3 unlocks)

- Activated the S6 asset gates that had been shipped **inert** (`[asset-ref]`, `[aspect-ratio]`).
- Gives the S2 D3 promise ("no image — S3 owns the asset ladder") a real, auditable owner.
- Satisfies the design review's accepts (§5/§7/§8) that wanted a deterministic, no-AI imagery
  story.
- Proves v1 needs **no manifest, no pubspec asset entries, no downloads** — a strong cost finding.

## What happens next

1. **S3 implementation** (dispatched to Claude): one pure `assetFor(screen, ir) → AssetSpec`
   selector + `patterns.assets` plan slot + a `[assets]` gate, then flip the two inert S6 gates ON.
2. **S4** (separate future slice): the declared-asset library + manifest, when a real file asset
   ever becomes necessary.

## Open owner call (§16)

- **Flip the `imagery` enum ON now** (`none | commercial | illustrative | photographic`) as the
  IR-visible vocabulary for the ladder — or keep it closed until S4/S7. Spike default: **flip on**
  (it records the intent the design review implied).

---

*Evidence is cited with real file:line at HEAD in the full report. Repository was read-only during
the spike; the single deliverable is the report itself (committed `0f86d7c`).*