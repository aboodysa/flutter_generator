# HANDOFF — V1 MILESTONE: frozen roadmap COMPLETE (round: 2026-08-18)

> Lean round summary. Previous content archived to `context_history.md`.

## Status

**The frozen roadmap is COMPLETE → v1 milestone reached.** S-CTX → P3 → P4 → **P5/D2** → **S-HERMETIC**
all done. Remaining: **S-TDE (visual lane S1–S7, from `VISUAL_GENERATION_REVIEW.md`)** and
**S-DEEPLINK** (backlog). P5/D2 is finished as 4 slices + D1 theme; S-HERMETIC closes C12.

## This round: P5/D2 + S-HERMETIC + visual-lane decision (2026-08-17/18)

### P5/D2 — state-model-conditional placement, COMPLETE (4 slices + D1)

- **D1 (theme)** `4e60c76` — `normalizeBrandSeed` (teal fallback 0D9488), `buildThemeDark()`,
  `AppAttributes.{brandSeedColor,themeMode}` (additive), dark goldens, `[theme]` gate
  (`validate.ts:79`, wired :1122).
- **Slice 1** `eff7168` — `StatePlacementSpec` + `statePlacementFor()` in composition.ts, plan/ctx
  wiring.
- **Slice 2** `38111b4` — screen.ts renders the spec; wizard (null spec) emits no loading/failure
  → fixes the wizard compile bug.
- **Slice 3** `e715646`+`6627d70`+`9d3e74b`+`c81049c` — empty-state CTA "New <Entity>"
  (`crudFormTargets`-gated, FAB nav), Retry `OutlinedButton` + `RefreshIndicator` on LIST screens
  only (owner decision); non-CRUD → no CTA; wizard/detail → nothing new; `*_empty.png` goldens.
- **Slice 4** `5256671`+`41c3a9d` — `[states]` gate (`validate.ts:647`, exported, wired :1266);
  re-derives `statePlacementFor` vs plan.json `patterns.states` + screen markers; retry marker
  requires `screen.type==="list"`. 3 negative controls demonstrated as real runs.

### S-HERMETIC — toolchain hermeticity, COMPLETE (3 slices)

- Spike (remote germany3/DeepSeek) `af5bdb3` — decisions: **D1 ADOPT (b)** caret+committed
  per-app `pubspec.lock` / REJECT exact pins; **D2 ADOPT** toolchain pin doc; **D3 CONFIRM+ADOPT**
  timestamp-absence gate. Found + grounded real drift: generated `sdk: ^3.0.0` below the proven
  floor; stale `localeDataVersion "intl-0.19.0"` vs resolved 0.20.2.
- Impl (Claude Mac): **`cebae60`** `[lockfile]`+`[timestamp]` gates; **`23a52ee`** SDK floor
  `>=3.11.0 <4.0.0` + intl-from-lock in context.ts; **`6a2e26d`** `FLUTTER_TOOLCHAIN.md` + C12
  closure; **`d7e9b28`** bonus — `[determinism]` crashed on real diffs (execSync no try/catch,
  like swiftdeterminism).
- Verified: typecheck clean; 4 apps regen — lib+plan.json byte-identical (only sdk line +
  localeDataVersion changed); validate 29/29 (rasheed_replica WARNs floor-differs per ratified
  severity; expense.semantic_app ERRORs no-lock — pre-existing); negative controls fired; `pub get`
  reproduced the lock byte-for-byte.

### Visual-lane product decision (Opus + ChatGPT ADOPT)

- `F_brief` `cb94e94` + review `eadee35` — Claude Opus reviewed the owner's visual-generation
  proposal: **13 ACCEPT / 6 MODIFY / 1 DEFER / 1 REJECT** (REJECT §18 LLM-visual-judge loop;
  kept via deterministic validators + human goldens). Spike backlog S1–S7 with priorities.
- ChatGPT replied **ADOPT WITH MODIFY** (record `039a8d6`); Opus produced contract **v2**
  `40e40e1` (`VLM_DESIGN_TO_IR_CONTRACT_V2.md`): provenance envelope
  `{origin,confidence,evidence,requiresApproval}` on every inferred decision, Observed/Inferred/
  Proposed/Approved split, id'd+nested sections with `emphasis.targetId`, AssetRequest decoupled,
  observations[] with evidence regions, **evidence coords ≠ layout coords**, existing `dashboard`
  archetype (not "market"), productGrid never encodes columns (320→1/390→2/1400→N), acceptance:
  provenance on every inferred value + no silent promotion.

## Ground truth table

| Area | State |
|---|---|
| Frozen roadmap (S-CTX→P3→P4→P5/D2→S-HERMETIC) | ✅ **v1 COMPLETE** |
| P5/D2 (placement) | ✅ COMPLETE (4 slices + D1) |
| S-HERMETIC (C12) | ✅ COMPLETE |
| VLM contract v2 | ✅ (product decision, ready for S1+) |
| S1 VisualIntent spike (P0) | **Next** (entry vocabulary for UI-SLC) |
| S6 no-vision-judge (P0) | Next (before any visual-QA work) |
| S2 section-layout IR / S5 banner (P1/P2) | After S1 |
| S3 asset ladder / S4 asset manifest (P1) | After P4-data layer / at S-HERMETIC hardening |
| S7 AI asset gen | Post-v1 / Phase 4 (trust boundary) |
| S-DEEPLINK | Backlog / owner call |

## Verification commands
```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
npx ts-node --transpile-only builder/src/validate.ts apps/<app>/input/<app>.ir.json apps/<app>/output/app
cd apps/<app>/output/app && flutter pub get && flutter analyze && flutter test
```

## Next steps (not started, for whoever picks this up)

1. **S1 — typed VisualIntent fragment** (P0): closed-enum `visualStyle` on ScreenModel, feeds §5.2
   scoring, zero new raw literals, byte-identical re-run. Spike (remote) → then impl slice.
2. **S6 — Section-18 defect coverage without a vision judge** (P0): proves the rejected
   LLM-visual-analyzer's intent is fully covered by deterministic validators + human goldens.
3. **S2 section-layout IR + S5 banner-composition** — the Keemart-level visual richness pass.
4. **S3 asset ladder, S4 asset manifest** — deterministic, no-AI (AI deferred to S7/Phase 4).
5. **S-DEEPLINK** — backlog/owner call (see SPIKE_PLAN.md).
6. **VLM contract v2 → feed the S1 spike brief** so the VLM-mapping contract and the IR fragment
   stay consistent.

## Rules
Additive-only; small commits; never bypass oracle/approval; SOLID; 0% LLM in deterministic core;
backward-compat via stash+regen+diff; zen = orchestrator, Claude-first implementer (remote opencode
fallback), spikes on remote agents per SPIKE_PROTOCOL; report everything to owner on Telegram; keep
HANDOFF lean (archive to context_history with dated header).