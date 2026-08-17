[0m
> build · deepseek-v4-flash-free
[0m
CHALLENGE 1: The determinism invariant is a tautology because "ctx" is never defined and silently absorbs every hard decision.
Scenario: A shell-variant choice or search-field pick differs between two runs; the "resolution" is that ctx differed — yet ctx is presumably LLM-authored like the IR, so nothing is actually pinned. "Same IR + same ctx -> same bytes" proves nothing about the selector.
Resolution-needed: Enumerate what composes ctx, how it's derived and validated, and which selection decisions are rules vs. inputs.

CHALLENGE 2: Only N=5 vs N=6 is answered; 0, 1, and 4 are not, and the N>5 failure mode is unspecified.
Scenario: A valid single-feature app may need no shell; an empty IR is a plausible test input; at N=6 the reply hard-fails generation with no fallback pattern (overflow menu, drawer, "More" tab) and no statement of whether that aborts the whole build or degrades.
Resolution-needed: A full decision table for N features (including 0 and 1) and a defined hard-abort-vs-fallback policy for over-capacity.

CHALLENGE 3: "Existing generators remain untouched unless the slice owns them" is contradicted by slices that share generators.
Scenario: P2 edits the list-screen generator, P4 edits the detail-screen generator, P5/D2 edits state widgets. A single list with search + actions + states is co-owned by three slices; each slice's invariant is false unless sequential handoff is defined — the reply's priority list doesn't provide it.
Resolution-needed: A generator-ownership matrix per slice plus an explicit conflict/merge rule for co-owned generators.

CHALLENGE 4: The endorsed P2 predicate "only when a title/name field exists" is precisely the banned hidden heuristic.
Scenario: A field named `t`, `n`, or a localized name won't trigger; the predicate keys on naming convention, not IR semantics. The reply bans heuristics inside screen.ts but blesses an equivalent name-based heuristic in the composition plan.
Resolution-needed: A semantic trigger (declared capability or feature-schema flag), never a field-name guess.

CHALLENGE 5: `field: <IR field id>` presumes one searchable field; type behavior and multi-field resolution are absent.
Scenario: A person feature has firstName, lastName, phone, address — which is searched? `contains` on a nullable, numeric, enum, or date field is undefined, and "future path for date/multi-field" is asserted, not designed.
Resolution-needed: Searchable-field resolution (single vs. multi) and a mode×field-type matrix including normalization (case, diacritics, Unicode, locale).

CHALLENGE 6: The "server-query future path without changing the screen generator architecture" claim is load-bearing and unverified.
Scenario: Client-side `contains` is synchronous over a loaded list; a server query is async, paginated, and injects its own loading/error/empty states — different data flow, caching, and state widgets, i.e., architecture. The assertion it won't touch screen generators is unsupported.
Resolution-needed: Scope P2 strictly to in-memory `contains` and declare server-query a new pattern, or define the async seam now.

CHALLENGE 7: P3 "cosmetic" collides with pagination and scroll restoration, which are data/state concerns.
Scenario: A 10k-row list needs fetch-on-scroll; "don't add scroll to IR" is fine, but who owns that loading state? And indexedStack retention (P1) plus app-restart restore requires persisted scroll offsets — UI state the reply claims doesn't exist.
Resolution-needed: Delineate viewport-scroll (cosmetic) from data-pagination (D2/P5) and specify scroll-state persistence/restoration.

CHALLENGE 8: The list-vs-grid-vs-slivers selection is a UI heuristic with no deterministic home.
Scenario: Some rule must pick ListView vs. GridView vs. CustomScrollView. If it lives in the composition plan, it's LLM input, not determinism; if in the screen generator, it's the exact heuristic the reply bans.
Resolution-needed: Name the artifact and rule that selects layout shape, or make shape a declared IR option.

CHALLENGE 9: Capability→action is 1:1 and static, but real actions are conditional, confirmable, and parameterized.
Scenario: A Delete action must be per-row disabled (referential integrity), require a confirmation dialog, or take a parameter (archive vs. hard delete). Confirmation, enablement predicates, overflow grouping at N actions, and parameters are all unspecified.
Resolution-needed: An action schema covering enablement, confirm/undo, grouping thresholds, and parameters.

CHALLENGE 10: Row-level authorization is a runtime concern the IR cannot express, so capability-driven emit misleads.
Scenario: Two users see the same IR; one may export, one may not. The generator emits one app, so "export capability" cannot yield correct permission UI without a runtime auth model the reply never defines.
Resolution-needed: Distinguish build-time capability (emit action) from runtime authorization (emit guard) and specify both.

CHALLENGE 11: Folding P5 into D2 creates two owners for placement rules, and runtime errors aren't in the IR at all.
Scenario: A network failure at runtime is not representable in static IR; the source of error copy/icon/retry is unspecified. D2 "owns richer composition," but the placement rules were to live here — precedence is undefined.
Resolution-needed: A single owner for state-placement rules and a defined source of runtime error content that isn't the IR.

CHALLENGE 12: "Byte-identical" is broken by the toolchain, not the selector.
Scenario: Two builds a day apart resolve different transitive dependency versions, embed date/copyright headers, or use a different formatter — output differs despite identical IR+ctx. The reply never mentions hermeticity.
Resolution-needed: Pin formatter, dependency lock, header timestamps, and file-ordering policy as part of the contract.

CHALLENGE 13: Deterministic icon mapping is under-constrained on collisions and missing glyphs.
Scenario: Two features map to the same icon, or one maps to a glyph absent from the pinned Material font; the generator emits ambiguous or broken output with no defined resolution (error vs. dedupe vs. allowlist).
Resolution-needed: A finite versioned icon allowlist with defined collision/absence failure modes.

CHALLENGE 14: P1 ignores deep links and state restoration, which "stable feature id" implies but doesn't deliver.
Scenario: A deep link to destination 3 must survive IR reordering (order is authoritative, ids are stable); the mapping and per-tab stack restoration on process death are unspecified.
Resolution-needed: Id-based destination addressing, deep-link routing, and per-destination restoration semantics.

CHALLENGE 15: If the composition plan is LLM-authored, determinism recurses.
Scenario: The plan (shell variant, search spec, action mapping) is produced by the same nondeterministic model that wrote the IR; nothing validates plan-vs-IR consistency, so two runs yield different plans → different bytes.
Resolution-needed: A deterministic plan-vs-IR validator, or rule-derived plans only.

CHALLENGE 16: Unknown capabilities have no specified failure mode, unlike the >5 precedent.
Scenario: An IR feature declares capability "share" with no target mapping. Silent ignore loses semantics; a target-limitation error would be consistent with the >5 rule but is not specified — the precedent isn't generalized.
Resolution-needed: A closed capability vocabulary with an explicit unknown-capability policy (error vs. ignore).
