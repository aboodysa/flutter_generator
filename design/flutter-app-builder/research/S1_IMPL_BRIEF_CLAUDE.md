# S1 — Implementation brief for Claude Code (Mac)

**From:** Orchestrator (zen) — **To:** Claude Code (implementer, Mac) — **Date:** 2026-08-18
**Source of truth:** `design/flutter-app-builder/research/SPIKE_S1_REPORT.md` (§13 decisions, §14 slice spec — READ ALL of it, esp. the fragment shape at §14.1 and the proof/negative-control matrix at §14+, currently lines ~382-400).
**Task:** Implement S1 per the spike's MODIFY conclusion, in ONE S-sized additive slice.

## Decisions (CLOSED by spike, ratified)

- **D1:** per-screen `ScreenModel.visualStyle`; **`density` stays app-level** (`AppAttributes.density`, already consumed by scoring `:80,141`). Do NOT move/copy it.
- **D2:** fragment v1 = `hierarchy {soft|balanced|strong}`, `cornerRadius {sharp|soft|rounded|pill}`, `personality {professional|friendly|premium|playful|minimal}`. **`imagery` → S3. `emphasis` → S2.** Do NOT add either now.
- **D4:** every value is a `VisualStyleValue<T> extends Provenance { value: T }` — reuse `builder/src/provenance.ts` envelope (`:15-22`). Generation must REFUSE until all visualStyle values are human-attested (no silent promotion). Add `[visualIntent]` gate.

## The ONE rule that cannot break (ChatGPT strengthening, adopted)

`visualStyle` **never directly selects a widget or asset**. It only FEEDS the deterministic scoring
function → composition strategy → component registry. `personality: friendly` biases scoring
(radius/spacing/hierarchy tuning from existing tokens); it can never mean `use FriendlyCard`.

## What to implement (§14 + your read of the report)

1. **`types.ts`** — `VisualHierarchy`/`VisualCornerRadius`/`VisualPersonality` type unions +
   `VisualStyleValue<T> extends Provenance {value:T}` + `VisualStyleModel` (all three optional;
   absent = byte-identical today) + `ScreenModel.visualStyle?: VisualStyleModel`.
2. **`scoring.ts`** — deterministic mapping each enum to a scoring effect (radius→radius token set,
   hierarchy→section-order/hero weight, personality→spacing/radius bias), meeting the spike's
   acceptance: 3 proof screens (tasks utility = balanced/professional; hr_service dashboard =
   balanced/strong clues; a commerce-type home if an IR exists else construct a minimal honest one)
   produce MEASURABLY DIFFERENT compositions, zero new raw literals, byte-identical re-run.
3. **`provenance` wiring** — extend `stampElement`/`humanAttest`/`unapprovedElements` (or a generic
   envelope walker) so NESTED visualStyle values are stamped, discoverable, and unapproved ones BLOCK
   generation. Reuse — do not fork the Provenance type.
4. **`validate.ts` `[visualIntent]` gate** — mirror `[theme]`/`[states]` posture: re-derive, check
   files, refuse unapproved values (the report's negative control: inject
   `visualStyle.hierarchy.requiresApproval:true` post-approve → generation/vetting refuses).
5. Do NOT touch `screen.ts` emission of composition unless the slice provably needs it — the fragment
   is scoring-input this pass (check the report's scope language; if §14 lists renderer changes,
   follow the report exactly, else keep it scoring-only).

## Verification (all mandatory, per report §14)

1. `npm run typecheck:builder` clean.
2. Regenerate 3 proof screens + all 4 apps/samples: validate PASS incl. new `[visualIntent]`.
3. **Measurably different**: assert the 3 proof screens' plan.json differently (score deltas scored),
   and a no-visualStyle IR stays byte-identical (stash-regen-diff).
4. **Provenance negative control** (real run): an unapproved visualStyle value → generation refused;
   after attestation → allowed.
5. No raw color/pixel/coordinate literal introduced by the mapping.
6. Small commits (types / scoring / provenance / gate), each logically one slice.

## Constraints

- Additive, no deletions. No IR/schema change beyond the additive ScreenModel field. Generated-code
  ownership/headers unchanged. Do NOT start S2/S3/S6 or any other item.
- Report: ≤12-line chat summary w/ commit hashes + the scoring-mapping one-liner per enum + gate
  wiring line + negative-control outcome.