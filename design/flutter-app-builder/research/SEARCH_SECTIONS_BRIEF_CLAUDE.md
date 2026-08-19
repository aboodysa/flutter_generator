# SEARCH — functional search for the sections archetype (keemart) — implementer brief

**For:** Claude Code (s-hermetic) — implementer lane
**Date:** 2026-08-19
**Zen orchestrator:** RCA `apps/keemart/output/rca/RCA-001-keemart-search-decorative.md`
(owner reported live on iPhone: "search does not work in keemart app")

## Task

Turn the sections-archetype `search` section from **decorative** into **functional** — mirroring
the list-archetype's existing search machinery (P2, `screen.ts:848-917`). Genuine user-visible
bug; fix the GENERATOR, never the generated app.

## Root cause (3 gates, RCA §3)

1. `builder/src/composition.ts:160` — `searchFor()` returns `null` for any
   `screen.type !== "list"`, so a sections home never resolves a `SearchSpec` →
   `searchEnabled` false (screen.ts:273) → no `_query`/`_searchController`/state.
2. keemart `Product` entity has **no `primaryDisplayField`** — `searchFor()` requires it
   (composition.ts:162-167).
3. `screen.ts:444-452` — `renderSection` `case "search"` emits a bare SearchBar
   (`hintText`+`leading`+shape only), while the list branch (:858-869) wires
   `controller: _searchController` + `onChanged: (v) => setState(() => _query = v)`.

## Fix (additive)

1. **composition.ts `searchFor()`** — allow sections screens that DECLARE a `search` section to
   resolve a `SearchSpec`: `if (screen.type !== "list" && !hasSearchSection(screen)) return null;`
   (`hasSearchSection` = screens/`search`-type anywhere in `screen.sections`). Keep the
   `primaryDisplayField` + String-field guards.

2. **screen.ts sections branch** — make the `search` case functional:
   - `case "search"` emits the CONTROLLED SearchBar: add `controller: _searchController,
     onChanged: (v) => setState(() => _query = v)` (mirror list branch).
   - Add the same `searchPrelude` the list branch has (screen.ts:848-852):
     `final query = _query.trim().toLowerCase(); final filtered = query.isEmpty ? <collection>
     : <collection>.where((item) => (item.<field>).toLowerCase().contains(query)).toList();`
     where `<collection>` is the section's resolved collection var and `<field>` is the
     SearchSpec field.
   - `horizontalCards` + `productGrid` render `filtered` instead of `state.<collection>`
     (itemCount + itemBuilder index lines).
   - `productGrid` uses the `No results for "$_query"` EmptyState when `query.isNotEmpty &&
     filtered.isEmpty` (mirror screen.ts:915).
   - The `[sections]`/`[search]` gates must still catch drift: any validator that re-derives
     search must match this resolution.

3. **keemart IR** — add `"primaryDisplayField": "title"` to Product (keemart.ir.json:15-24,
   one additive line).

4. Regenerate keemart (`index.ts` → `apps/keemart/output/app`), run every gate
   (`validate.ts`), `flutter analyze` + `flutter test` (squeeze 320/390/1400 green incl the new
   filtered grids), determinism (two regens `diff -r` empty), negative control (a scratch
   sections screen WITHOUT a `search` section must regen a **StatelessWidget**, byte-identical
   to pre-change for that screen).

## Verification (report every output)

- `npm run typecheck:builder`
- `npx jest test/s1_visual_intent.test.ts` → 20/20
- `npm test` → 85/85 + your new tests (add `[search]`-on-sections coverage: sections+search →
  stateful+filtered; sections without search → StatelessWidget no-op)
- regen keemart → `validate.ts` ALL PASS + `flutter analyze` clean + `flutter test` green
- determinism byte-identical ×2
- negative control (scratch IR, removed after)

## Contract reminders

- Additive only; never delete; small commits; no secrets; `[generated]` headers + content-hash
  preserved; generators stay pure `(IR, ctx) → string` (no I/O).
- Commit slices: `feat(sections): functional search section (controller+filter, mirrors list
  archetype)`, `fix(samples/keemart): Product primaryDisplayField title`, test commit.
- When done, report to the orchestrator with command outputs. Push to master.