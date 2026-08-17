# P2 Implementation Brief — Per-list search (explicit composition `search:` block)

Source of truth: `INTERFACE_PATTERN_CONTRACT.md` §4 (P2) + §3.3 acceptance invariants.
Grill resolutions folded in: `GRILL_S0_REPLY.md` **C4** (semantic trigger, never a name-guess),
**C5** (single-field scope + mode×type normalization matrix), **C6** (in-memory `contains` only;
server-query is a new pattern, NOT a free "future path" here).

## Objective

Add deterministic per-list search: a `search:` block emitted into `plan.json` by the centralized
pattern selector (composition module), rendered by the list-screen generator **from the payload
only** — never an independent decision inside `screen.ts`. Opt-in, additive, byte-identical for
unchanged IRs.

## Scope (locked)

- **Single search field per list.** `search.field` is one IR field id. No multi-field in P2.
- **Mode `contains` only** — in-memory, synchronous, case-insensitive (no server-query, no
  startsWith/enum/date in P2; future modes change the payload, never the generator architecture).
- **`enabled` predicate is SEMANTIC, not name-based** (grill C4): the screen is a list screen
  whose repo has `list` AND the entity declares a **primary display field** (the IR
  `primaryDisplayField`/display-field semantic — the same signal the demo rows and list cards
  read; NOT a `title`/`name`/`label` string match). If the IR has no explicit display-field
  semantic, the predicate stays false. Document the exact IR key read.
- **Normalization** (grill C5): `contains` compare is `toLowerCase()` on both sides. State the
  boundary: no diacritics/Unicode folding in P2 (call it out in the brief + validate note so a
  later slice can extend without touching the architecture).

## Deliverables

1. **Composition selector** (in `composition.ts` or the module that owns pattern selection):
   `searchFor(screen, entity, repo)` → `SearchSpec | null`. Deterministic; reads only IR
   semantics. Emitted into `GenerationPlan.patterns.search` (per-screen, keyed by screen path —
   follow the P1 `patterns.shell` precedent).
2. **`plan.json` payload** shape (mirror contract §4):
   ```json
   { "search": { "enabled": true, "field": "<ir field id>", "mode": "contains" } }
   ```
   Present per applicable list screen; absent elsewhere.
3. **List-screen generator change**: render `SearchBar` + filter-as-you-type + no-results
   `EmptyState` ONLY when the screen's `patterns.search` is present and `enabled`. All behavior
   reads the payload; no heuristic in the generator. Must remain byte-identical for screens
   without a search block.
4. **`[search]` validate gate** (additive, in `validate.ts`):
   - for each screen with `patterns.search.enabled`: list screen + repo `list` + declared primary
     display field all hold (re-asserts the selector);
   - generated list screen for that path contains a `SearchBar` (or the exact widget name you
     emit) AND no other list screen contains it;
   - screens without a search block emit no SearchBar.
5. **Sample proof**: regenerate **all 4 apps** (tasks / work_auth / hr_service / ledgerly).
   - Single-feature apps that have a list + display field get search; those without stay
     byte-identical. Ledgerly: expect search on its list screens with a primary display field.
   - Run `validate.ts` on each outDir — `[search]` PASS everywhere, `[shell]` still PASS,
     determinism still PASS.
6. **CDP drive** (REQUIRED for this UI-affecting slice — AGENTS §14 CDP gate): build web + serve,
   drive ledgerly + tasks: type in SearchBar → list filters as-you-type; gibberish → no-results
   EmptyState renders (no overflow); clear → full list back. Overflow scan 320/390/768/1280.
   Findings under `apps/<app>/output/qa/p2-search/` (folder per app, e.g.
   `apps/ledgerly/output/qa/p2-search/`). Capture AX + screenshots; note the same screenshot
   persistence limitation as P1 (record observations if PNGs don't resolve).
7. **Goldens**: regenerate iPhone-size goldens (`flutter test --update-goldens`, 390×844 via
   existing golden-test setup — FontLoader + buildTheme, never bare MaterialApp). These MUST
   render real search UI for the searchable list screens. Send to owner Telegram (photo per
   golden + one-line progress).

## Acceptance (per contract §3.3 invariant)

- Same IR + same ctx + same generator version → byte-identical output. Single-feature apps with
  unchanged IR stay byte-identical (the search block only appears where the selector decides).
- `[search]` gate PASS on all 4 apps; `[shell]` + determinism still PASS.
- Search behavior verified via CDP (filter / no-results / clear, no overflow 320-1280).
- Existing generators untouched except the one owning the list screen template (P2 owns the list
  screen template per contract §8 ownership note) + the composition/plan/validate modules named
  above.

## Out of scope (explicit non-goals)

- No multi-field / startsWith / enum / date / server-query. (grill C5/C6 — declare them new
  patterns when needed.)
- No runtime auth gating of search (grill C10 is a P4+ concern).
- No persisted search state across tab switches (indexedStack keeps it alive by default in P1;
  document that behavior, don't add explicit persistence).

## Verification commands

```bash
npm run typecheck:builder
npx ts-node --transpile-only builder/src/index.ts <ir> <out>   # each app
npx ts-node --transpile-only builder/src/validate.ts <ir> <out>
cd apps/<app>/output/app && flutter analyze && flutter test    # goldens: --update-goldens first
# CDP: flutter build web --base-href=/<app>/ + serve + shared cdp_driver.py walk
```

## Ownership / discipline

- Small commits per slice (one logical change per commit). Never delete. Fix the generator, never
  hand-edit a generated app — regenerate after any generator change.
- Update `CODE_CATALOGUE.md` rows for anything new (search selector, gate, QA findings).
- Telegram: notify owner at slice start, on each commit, with goldens + final summary.
