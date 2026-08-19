# HANDOFF — VISUAL LANE S1 ✅ / S2 ✅ / S6 ✅ / S3 ✅ (round: 2026-08-19)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

S-HERMETIC → S-CTX → P3–P5 baseline v1 COMPLETE. **Visual lane S1, S2, S6, and S3 all done**.
Next on the roadmap: S4 (asset library+manifest), S7 never (stub). Two pending owner calls gate the
next dispatches (see bottom). Lanes: Claude Code (Mac `s-hermetic`, freshly cleared) for
implementation; remote opencode (tracematrix `germany3`, DeepSeek Flash Free) for read-only spikes
(fresh session, cwd must be `/root/fg-p5`).

## This round (2026-08-18/19)

### S2.1 sections hardening — DONE (Claude, 3 commits)

- `9bed666` — hero-cardinality ≤1, duplicate-section-id, state-model gate checks (`[sections]` gate
  `validate.ts:1097-1215`).
- `098d9a8` — renderer `ValueKey('section-<id>')` per section + inline `EmptyState` for empty
  productGrid.
- `d88d146` — `AppHeroBanner` heading semantics (a11y).
- `d4e5498` — keemart regen sync (golden: home_screen.png only).
- Ratification: `S2_RATIFICATION.md` (8b19a5f) closed A1 (emphasis-drop CONFIRMED, never shipped) +
  B1 (sections archetype CONFIRMED). Second review's 4 structural gaps → S2.1 brief → landed.

### S6 slice 3 — DONE (Claude, vacuous-then-flipped by S3)

- `3d8653d` — `[asset-ref]` + `[aspect-ratio]` gates built **vacuous** (inert until S3).
- Flipped ON by S3 (`14c4e19`) — now load-bearing against `patterns.assets`.

### S3 asset-ladder spike + implementation — DONE

- **Spike** (germany3): `SPIKE_S3_REPORT.md` (0f86d7c), 469 lines, net **SPLIT** — D1 vocab MODIFY,
  D2 procedural ADOPT, D3 icon ADOPT, D4 library DEFER→S4, D5 trust ADOPT. No AI path exists; v1
  needs no manifest (procedural assets emit no file).
- **Explainer for owner**: `S3_SPIKE_EXPLAINER.md` (18f4deb) sent to Telegram as sendDocument.
- **Implementation** (Claude, zen-verified):
  - `cdf0606` — `assetFor(screen, ir): AssetSpec|null` selector + `AssetSpec` type + `patterns.assets`
    plan slot + `ctx.assets` wiring + renderer verbatim consumption (§14.1/14.3/14.4).
  - `14c4e19` — `[assets]` gate (re-derive+diff, closed-kind enum, provenance) + flipped S6 slice-3
    `[asset-ref]`/`[aspect-ratio]` ON.
  - `e5e1005` — `test/s3_assets.test.ts` (22 new tests) incl. negative controls (out-of-enum kind
    FAIL, raster tokenRef FAIL, raw aspect-ratio literal FAIL) + determinism byte-identical.
  - Verified: typecheck clean, jest s1 20/20, **npm test 85/85 (10 suites)**, keemart
    `[assets]`/`[asset-ref]`/`[aspect-ratio]` PASS, keemart flutter 9/9 incl squeeze 320/390/1400,
    golden unchanged.
- §14.2 (imagery enum flip) SKIPPED pending owner call (assumed B/closed).

### Keemart screens delivered (owner request: "أحتاج الشاشات")

- Regenerated keemart from current generator + `flutter test --update-goldens` (home_screen.png).
- Exposed on tailnet additively: `/keemart` → `http://127.0.0.1:8083` (`tailscale serve --set-path`),
  existing `/api` `/tasks` `/hr_service` mounts preserved, `/` config intact (its 8080 mall server
  is down — pre-existing).
- **CDP-verified live**: AX 71 nodes (hero heading "Ready For School", Products, Cart,
  Add-to-cart); **zero overflows @320/390/768/1280**; no console/network errors.
- Golden + live-390 screenshot + URL sent to Telegram.
- NOTE: this zen model cannot read images — structural verification only; visual fidelity is the
  owner's iPhone/Telegram gate.

### work_auth cleanup — DONE (Claude, zen-verified)

- `13005a7` — work_auth `[determinism]/[plan-determinism]/[contrast]/[literals]` FAILs were **stale
  generated output**, not a generator bug. Fresh regen → `VALIDATION PASSED` (all 35 gates),
  byte-identical ×2.
- Discovered REAL pre-existing defect: `WorkAuthWizardScreen` overflows **20px @320×480** in the
  viewport-squeeze test. RCA: `apps/work_auth/output/rca/RCA-workauth-wizard-overflow-320.md`
  (9611cd6). Proposed generator fix: wrap wizard step body in its own `SingleChildScrollView`.
  **Pending owner approve/defer.**

### Remote-lane incidents (both RCA'd, `RCA-S3-REMOTE-STALE.md` b59c6f6)

1. Remote repo silently stuck at `d937b02` — ff-merge aborted on untracked `SPIKE_S2_REPORT.md`
   collision; fetch shown as success. Prevention: post-pull `git rev-parse HEAD`==origin assert +
   empty status; untracked files stay outside the repo tree.
2. S3 spike launched with cwd `/flutter_generator` (stale NON-git copy) instead of `/root/fg-p5` —
   researched stale code. Box holds 3 repo copies. Prevention: lane dispatch MUST `cd /root/fg-p5`
   explicitly and state it in the prime prompt.

## Ground truth

| Item | Value |
|---|---|
| HEAD | `18f4deb` (explainer); impl HEAD `e5e1005`+`14c4e19`+`cdf0606` |
| npm test | 85/85 (10 suites) — 63 base + 22 S3 |
| jest s1_visual_intent | 20/20 |
| keemart validate | ALL PASS incl `[assets]`,`[asset-ref]`,`[aspect-ratio]` |
| keemart flutter | 9/9 incl squeeze 320/390/1400, golden unchanged |
| Remotes | tracematrix `/root/fg-p5` (live repo, use ONLY this), germany3 fresh-idle |
| Tailnet | `/keemart`@8083, `/tasks`@8081, `/hr_service`@8082, `/api`@3000. `/`@8080 down (pre-existing) |

## Pending owner calls

1. **S3 §14.2 imagery flip**: A=flip `imagery` enum ON (none|commercial|illustrative|photographic)
   or B=keep closed (assumed B so far). Small isolated additive step either way.
2. **work_auth wizard overflow**: approve the generator fix (wizard step inner
   `SingleChildScrollView`) or defer.

## Next steps

1. Owner answers calls → if A, tiny imagery-flip brief to Claude (§14.2); if approve, wizard-scroll
   brief.
2. Poll the committed test suite (`npm test`) is the verification gate for any future slice.
3. S4 (asset library+manifest) is the next roadmap slice after the owner's calls — new spike brief
   (remote) when picked up, cwd pinned to `/root/fg-p5`.

## Key files

- `SPIKE_S3_REPORT.md`, `S3_SPIKE_EXPLAINER.md`, `S3_IMPL_BRIEF_CLAUDE.md`
- `S2_RATIFICATION.md`, `S2_HARDENING_BRIEF_CLAUDE.md`
- `RCA-S3-REMOTE-STALE.md`, `apps/work_auth/output/rca/RCA-workauth-wizard-overflow-320.md`
- `test/s3_assets.test.ts` (22 tests), `builder/src/composition.ts` (assetFor), `validate.ts`
  (`[assets]`, `[asset-ref]`, `[aspect-ratio]`)
- `apps/keemart/` (sections+assets proof), `apps/work_auth/` (clean now)