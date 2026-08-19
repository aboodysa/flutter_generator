# RCA-001 — keemart search bar is decorative (does nothing)

**Finders:** owner (live iPhone testing), 2026-08-19
**Lane:** zen orchestrator diagnosis → Claude Code fix (dispatch in progress)
**App:** `apps/keemart` (S2 sections proof sample)
**Severity:** functional — user-visible control with zero effect
**State:** CONFIRMED, fix dispatched

## 1. Symptom

Owner testing the live keemart home on iPhone (Tailscale `/keemart`) reported: **"search does
not work in keemart app".** Typing in the search field produces no filtering of the product
grid / horizontal cards.

## 2. Investigation

- Generated `home_screen.dart` line 26 renders:
  `SearchBar(hintText: 'Search Products', leading: const Icon(Icons.search), shape: ...)`
  — **no `controller`, no `onChanged`, no filter**. The screen is a `StatelessWidget`.
- Generator `builder/src/generators/screen.ts:444-452` (`renderSection` `case "search"`):
  comment states verbatim: *"Decorative only in this slice — P2's searchFor/`_query` wiring is
  list-archetype-only, composition.ts:157."*
- `composition.ts:160` `searchFor()`: `if (screen.type !== "list") return null;` — a sections
  home NEVER gets a `SearchSpec`, so `searchEnabled` (screen.ts:273) is false and the whole
  needs-context/search machinery never engages.
- Keemart IR `Product` entity (keemart.ir.json:15-24) has **no `primaryDisplayField`** —
  `searchFor()` additionally requires it (`composition.ts:162-167`), so even a hypothetical
  sections-search resolution would not fire.
- Working precedent: list-archetype screens (tasks sample) get real search — `_searchController`,
  `_query` (screen.ts:1230-1231), `onChanged: (v) => setState(() => _query = v)` (screen.ts:865),
  `final filtered = query.isEmpty ? items : items.where((item) => (item.<field>).toLowerCase()
  .contains(query)).toList()` (screen.ts:849-850), `EmptyState('No results for "$_query"')`
  (screen.ts:915).

## 3. Root cause

A **generator capability gap, not an app bug**: the `search` section type in the sections
archetype is decorative by design, and sections screens are excluded from `SearchSpec`
resolution on THREE independent gates:

1. `searchFor()` hard-returns null for non-list screens (`composition.ts:160`).
2. The entity needs a `primaryDisplayField` (String) that keemart doesn't declare
   (`composition.ts:162-167`).
3. `renderSection case "search"` emits a bare SearchBar without the controller/onChanged/filter
   wiring the same file's list branch already has (`screen.ts:444-452` vs `:858-917`).

Result: the UI advertises search, the user types, nothing filters.

## 4. Fix / solution (generator only — never the generated app)

Dispatch `SEARCH_SECTIONS_BRIEF_CLAUDE.md`:
1. **composition.ts** — allow `screen.type === "sections"` (and the screen declares a `search`
   section) to resolve a `SearchSpec`; keep the `primaryDisplayField` + String-field guards.
   (Exact rule: `screen.type === "list"` OR `sections` with a `search`-type entry.)
2. **screen.ts sections branch** — `case "search"` emits the CONTROLLED SearchBar (mirror
   list branch: `controller: _searchController`, `onChanged: (v) => setState(() => _query = v)`),
   and the sections body computes `final filtered` from `state.<collection>` the same way the
   list branch prelude does (screen.ts:848-852); `horizontalCards` + `productGrid` render
   `filtered`; `productGrid` shows the `No results for "$_query"` EmptyState when non-empty
   query filters to zero.
3. **keemart IR** — add `"primaryDisplayField": "title"` to Product (one additive line).
4. Regenerate keemart, run all gates + overwhelm the `[sections]`/`[search]` gates, run
   `flutter analyze/test` (squeeze test covers the new filtered grids), determinism, negative
   control (search-with-no-SearchSpec sections screen must NOT become stateful).
5. Rebuild web `--base-href=/keemart/`, re-serve on 8083 (nohup node static), **CDP-verify**
   live typing: type "Pen" → grid filters; clear → all items back (AX + screenshot).

## 5. Logic / rationale

- The fix reuses the list branch's existing, tested machinery (`_query`/`_searchController`/
  `filtered`/EmptyState) instead of inventing a second search implementation — identical
  posture, shared code path, no new design surface.
- Making the sections screen stateful only when a SearchSpec resolves (same `needsLocalState`
  flag the list screens already use) keeps every searchless sections app a StatelessWidget —
  byte-identical output for the non-search case (the `[determinism]` gate's job).
- Alternatives rejected: (a) top-level "filter all sections" controller threaded through every
  card widget = over-engineering for a v1; (b) making every search section screen always
  stateful = regresses determinism/no-op slices; (c) patching the generated `home_screen.dart` =
  contract violation (never edit generated app).

## 6. Verification (to run after the fix lands)

```bash
npm run typecheck:builder
npx jest test/s1_visual_intent.test.ts          # 20/20
npm test                                        # 85/85 + new tests
npx ts-node --transpile-only builder/src/index.ts apps/keemart/input/keemart.ir.json apps/keemart/output/app
npx ts-node --transpile-only builder/src/validate.ts apps/keemart/input/keemart.ir.json apps/keemart/output/app
# flutter analyze + flutter test in apps/keemart/output/app (incl squeeze 320/390/1400)
# determinism: two regens diff -r empty
# negative control: scratch IR sections screen WITHOUT search section → regenerated class stays
#   StatelessWidget (no _query), output byte-identical to pre-change for that screen
# CDP: type in live /keemart search → products filter; clear → restore
```

## 7. Prevention

- New validator/gate (proposal): `[search]`-style gate — a sections screen with a `search`
  section but an entity lacking `primaryDisplayField: <String>` FAILS at validate time, not at
  user-runtime. Mirrors `[sections]`/`[assets]` posture (independent re-derivation, closed
  vocab, provenance).
- IR input guideline: any IR declaring a `search` section or a list screen must set
  `primaryDisplayField` on the bound entity.

## Open / follow-ups

- The "pipeline.ts oracleDir gap" Claude flagged during the wizard fix (typed but unsubmitted at
  its prompt) — capture as a follow-up ticket, then clear the stale prompt in the s-hermetic
  lane before dispatching SEARCH_SECTIONS_BRIEF_CLAUDE (same lane).