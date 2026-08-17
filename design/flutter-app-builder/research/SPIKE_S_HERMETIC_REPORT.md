# S-HERMETIC — Pin the toolchain for reproducible (L2) builds: pin-strategy, toolchain-pin, timestamp-absence

> Spike report, §17 format (SPIKE_PROTOCOL.md §17). Research-only — read-only; NO commits, no
> edits, no `flutter`, no `npm run`/builds (1vcpu/1gb box). Repo: `/root/fg-p5`, master synced
> (HEAD `2ab6473`, `git status` clean before/after).
> Grounding: DOI benchmark — repo state on 2026-08-18.

## 1. Status

Research-only. No scratch generation was run (the brief forbids builds on this box), so every
claim is grounded in: generator source (`builder/src/**`), committed generated apps
(`apps/*/output/app/`), committed sample outputs (`builder/output/*/`), the committed root Flutter
package (`pubspec.yaml`/`pubspec.lock`, the payment pilot), and the repo's own design docs
(`SWIFTUI_GROUND_TRUTH.md`, `SPIKE_PLAN.md`, `DETERMINISM_CONTRACT.md`). Repository tree was not
modified (`git status` clean).

## 2. Hypothesis — and a corrected premise

> C12's "byte-identical broken by toolchain, not the selector" is a **one-layer-up** grounding
> problem: `project.ts` emits caret ranges, no lockfile is committed, so two byte-identical
> generator runs can still produce differently-behaving BUILT apps.
> Candidate fixes: (a) drop the `^` and emit exact pins; (b) keep carets + commit a per-app
> `pubspec.lock` and treat drift as a reviewable diff.

**Corrected premise (evidence in §3.2/§5):** the "no committed lockfile" half of the hypothesis is
**false at HEAD**. Per-app `pubspec.lock` files ARE committed and tracked (they arrived in the base
import, now attributed to `fd120d7`, 2026-08-17): 4 committed apps + 5 of 6 `builder/output`
samples have tracked lockfiles (9 of 10 generated output projects total; `expense.semantic_app` is
the only one without). The genuinely missing pieces are: the lockfile is **not emitted by the
generator** (it is a first-`pub get` artifact), there is **no `[lockfile]` validate gate**, the
**SDK floor in `pubspec.yaml` is looser than the recorded toolchain**, and the generated
`builder.lock.json` defensive constant **stales real package resolution** (`localeDataVersion:
intl-0.19.0` vs. resolved `intl 0.20.2` — a real, live drift example inside the committed tree).
Those are the actual gaps this spike decides on.

## 3. Ground truth

### 3.1 Exact caret ranges the compiler emits today

`builder/src/generators/project.ts` (line numbers as of HEAD `2ab6473`; the brief's `:28-29` cite
is stale — actual lines differ):
- `:8-11` — `PROVIDER_VERSIONS = { bloc: "^8.1.6", riverpod: "^2.5.1", none: "" }`.
- `:33` — `get_it: ^8.0.1` (only when `decision.di === "get_it"`).
- `:34` — `go_router: ^17.1.0` (only when `decision.routing === "go_router"`).
- `:36` + `builder/src/persistence.ts:24-25` — `drift: ^2.34.3` / `hive_ce: ^2.19.2` (only when
  that persistence backend is selected; fragments carry their own caret).
- `:51` — `environment: sdk: ^3.0.0` (always).
- `:56` — `equatable: ^2.0.5` (always).
- `:57` — `dio: ^5.8.0+1` (always).
- `:58` — `flutter_secure_storage: ^9.2.4` (always).
- `:63` — `flutter_lints: ^3.0.0` (dev).
- `flutter:`/`flutter_test:`/`flutter_localizations:` are SDK packages with `sdk: flutter` (no
  numeric pin — correct and required).

Committed `apps/tasks/output/app/pubspec.yaml:1-20` matches this byte-for-byte
(`flutter_bloc: ^8.1.6`, `get_it: ^8.0.1`, `go_router: ^17.1.0`, `dio: ^5.8.0+1`,
`flutter_secure_storage: ^9.2.4`, `equatable: ^2.0.5`, `flutter_lints: ^3.0.0`, `sdk: ^3.0.0`).

### 3.2 Lockfile state across the committed tree

`git ls-files` / `git status --porcelain` (clean) — ALL present lockfiles are TRACKED, none dirty:

| Path | State |
|---|---|
| `apps/{tasks,hr_service,ledgerly,work_auth}/output/app/pubspec.lock` | committed & tracked |
| `builder/output/{generated_app,pipeline_todo,inventory_app,todo_app,rasheed_replica}/pubspec.lock` | committed & tracked |
| `builder/output/expense.semantic_app/pubspec.lock` | **absent** (only sample without) |
| `pubspec.lock` (payment pilot `fahs`) | committed & tracked |

Resolved versions (from `apps/tasks/output/app/pubspec.lock`) vs the caret minimums they satisfy:
`flutter_bloc 8.1.6` (= min), `get_it 8.3.0` (min 8.0.1), `go_router 17.5.0` (min 17.1.0),
`dio 5.11.0` (min 5.8.0+1), `equatable 2.1.0` (min 2.0.5), `flutter_lints 3.0.2` (min 3.0.0),
`intl 0.20.2` (ledgerly only — locale app). The lockfile's `sdks:` block records the resolution
floor it was built against: `dart: ">=3.11.0 <4.0.0"`, `flutter: ">=3.38.4"`.
`tasks`/`work_auth` locks are identical (md5 `0c612d6…`), `hr_service`/`ledgerly` identical (md5
`70fa891…`) — differing only by the ledgerly locale deps (`flutter_localizations` + `intl`),
proving locks are per-app and additive.

Key semantic: `flutter pub get` reuses an existing, still-satisfied lock without re-resolving; a
committed lock therefore **already freezes the transitive graph** (L2) for as long as the generated
carets stay satisfiable. The gaps are governance (-gate), provenance (not emitted by the compiler),
and the SDK-floor mismatch (§3.4).

### 3.3 Timestamp absence (all generated outputs)

- `grep -rn "DateTime.now|toISOString"` over `apps/{tasks,hr_service,ledgerly,work_auth}/output/app/
  lib` `test` `pubspec.yaml` `plan.json` `builder.lock.json` `regions.json`: **zero hits in headers/
  top matter / metadata**. No ISO-date literal in any header band.
- Generated headers are static, deterministic strings with **no date**:
  `// [generated] generator=ProjectGenerator template=pubspec.v1 class=structural
  ownership=generated` (`project.ts:43`, same for every generator template).
- The word "DateTime.now()" DOES appear in generated `lib/` **runtime** code —
  `naming.ts:45` (`newIdExpr` → `DateTime.now().millisecondsSinceEpoch` for entity id creation) and
  `generators/audit.ts:61` (`final at = DateTime.now()` for audit events). These are **semantic
  runtime content**, not build-environment stamps — a naive whole-file `DateTime.now` grep would
  false-positive on legitimate generated content (this constrains the regression-check design, §7).
- `builder.lock.json` (tasks) captures strategy versions, `generatorVersion: "1.0.0"`, SDK
  constraint `>=3.0.0`, `localeDataVersion: "intl-0.19.0"`, `fontVersion: "tajawal-1"` — no date.

### 3.4 Toolchain record and SDK floor

- `design/flutter-app-builder/research/SWIFTUI_GROUND_TRUTH.md:88-94` — the **Flutter-equivalent
  record ALREADY EXISTS** (§1.5 "Flutter (existing pipeline baseline)"): `flutter --version` →
  **Flutter 3.44.3 • stable**, **Dart 3.12.2**, **DevTools 2.57.0** (captured as part of the
  SwiftUI spike's tooling census). `DESIGN.md:474` independently references Flutter 3.44 web
  behavior. The brief's "it appears undocumented here" is stale — the record exists, it just isn't
  linked from a Flutter-specific pin doc and there is no CI enforcement.
- No `fvm`, `.tool-versions`, `.flutter-version`, or CI workflows exist anywhere (`ls .github` =
  absent; no `.github` in repo). The generator's own `pubspec.yaml` SDK floor is `^3.0.0` while the
  committed locks demand `dart >=3.11.0`, `flutter >=3.38.4` — i.e. the *declared* floor is far
  below the *proven* toolchain. That mismatch is the suppressible part (see §12).

### 3.5 Existing validate gates (timestamp/lock reconciliation)

`builder/src/validate.ts` has NO timestamp-absence gate and NO lockfile gate today.
- `:1125` — `[header]` checks only that `[generated] generator=` is present; no date scan.
- `:1091-1117` — `[determinism]` regenerates once and byte-diffs `lib/`; `[plan-determinism]`
  JSON-compares `plan.json`. Neither touches header dates or `pubspec.lock`.
- Gate inventory at HEAD: `[header] [secret] [idiom] [arch] [determinism] [plan-determinism]
  [fidelity] [strategy-fidelity] [money] [datepicker] [verdict] [oracle] [split] [symbols] [shell]
  [search] [scroll] [actions] [states] [theme] [tenant] [auth] [attachment] [budget] [audit]
  [export] [outbox] [platform] [l10n]` + Swift gates. **`[lockfile]` and `[timestamp]` do not
  exist.**
- `.gitignore` does NOT ignore `pubspec.lock` — lockfiles are intended to be tracked (and are).

## 4. Questions (SPIKE_PROTOCOL §6 — answered with evidence)

1. Exact pins (a) vs caret+committed-lock (b) — which one actually produces a reproducible build
   graph, at what dev-loop cost? Which dependency most needs pinning?
2. Is the repo's Flutter/Dart toolchain already recorded, and what would a pinned-CI doc need to
   contain (given no CI exists in-repo and Flutter runs on the Mac)?
3. Is timestamp-absence already true everywhere (headers + metadata), and what is the cheapest
   `validate.ts` regression that keeps it true without false positives?

## 5. Evidence

All cited in §3. Highlights:
- **Caret ranges:** `project.ts:8-11,33-34,36,51,56-58,63` + `persistence.ts:24-25`.
- **Lockfiles committed & tracked:** `git ls-files` for the 9 paths in §3.2; clean
  `git status --porcelain`; package-set pairing of the two lock variants proves per-app additive
  locks.
- **Resolution floor vs declared floor mismatch:** `apps/tasks/output/app/pubspec.lock` `sdks:`
  (`dart >=3.11.0`, `flutter >=3.38.4`) vs `pubspec.yaml` `sdk: ^3.0.0`; `builder.lock.json`
  `localeDataVersion: "intl-0.19.0"` vs resolved `intl 0.20.2` (ledgerly).
- **Toolchain record exists:** `SWIFTUI_GROUND_TRUTH.md:91-93`.
- **No timestamp gate / no timestamp presence:** gate inventory §3.5; grep results §3.3 (empty in
  header bands; runtime-only `DateTime.now()` in `naming.ts:45`/`audit.ts:61`).
- **Determinism gates already prove L1:** `[determinism]` (`validate.ts:1091-1117`) — same IR +
  same toolchain → identical generated bytes is the shipped, proven invariant.

## 6. Semantic contract

No IR/schema change. The decisions live in **packaging/config + validation + docs**:
- `pubspec.yaml` stays caret-based (option (b)): reproducibility comes from the **committed lock**,
  which is the only artifact that can pin the *transitive* graph (pins only pin direct deps).
- The toolchain pin is a **documented constant + SDk-floor tightening** in generated pubspec
  (`environment.sdk`), linked to the recorded Flutter/Dart version — not a new IR semantic.
- A `[timestamp]` check is a **pure regex over the emitted file set** — derivable deterministically
  from generated output alone, no IR involvement.

## 7. Determinism analysis

- **Inputs:** IR + generator version + (newly) the committed lockfile + the SDK floor constant.
  No wall clock, no env, no network, no randomness enter generation. The lock is *consumed by pub*,
  not by generation — L1 stays untouched.
- **Two-layer contract (SPIKE_PLAN.md §4-5 review-resolution edit 5, binding):**
  - **L1 generator determinism** = same IR + same generator → identical bytes. **Already proven** by
    `[determinism]` + `[plan-determinism]`; S-HERMETIC adds nothing to L1.
  - **L2 build reproducibility** = same source + same SDK/dependency lock → equivalent dependency
    graph and (toolchain-controlled) build output. **This is S-HERMETIC's target.** We do NOT
    promise byte-identical binaries (would require controlling the full Dart/AOT/compiler env).

## 8. Ownership analysis

- `builder/src/validate.ts` — new `[lockfile]` gate + new `[timestamp]` gate (additive checks, no
  existing gate touched; the failed-set computation at `validate.ts:1329` gains two fields).
- `builder/src/generators/project.ts` + `builder/src/persistence.ts` — SDK floor constant only
  (`sdk: ^3.0.0` → floor matching the recorded toolchain); caret ranges otherwise unchanged.
- `builder/src/context.ts:37` — update the stale `localeDataVersion`/`fontVersion` constants to the
  resolved reality (defensive-record hygiene), OR drop the locale-version claim and record resolved
  lock versions instead.
- CI/docs — new `FLUTTER_TOOLCHAIN.md` (or a section in the determinism contract) citing
  `SWIFTUI_GROUND_TRUTH.md:91-93` + the committed lock `sdks:` as the target floor; no CI exists to
  enforce (Flutter runs on the Mac) so the enforcement seam is validate.ts acting on the lock.
- No generator fork; shared-generator rule respected (validate gates added, not duplicated).
- **Owner flagged as a decision-log item:** the owner must ratify "commit lockfile per app" as
  policy (AGENTS.md convention already implies it — lockfiles are not gitignored and are committed;
  the spike recommends formalizing, not changing, the state).

## 9. Failure modes (each deterministic)

| Condition | Deterministic outcome |
|---|---|
| App output has no `pubspec.lock` | `[lockfile]` FAIL (missing) — regenerate + `pub get` + commit, like `web/` |
| `pubspec.lock` exists but its `sdks:` floor < declared toolchain floor | `[lockfile]` FAIL (stale) — document which floor governs |
| Header band contains an ISO date (`\d{4}-\d{2}-\d{2}`) or "generated on <date>" | `[timestamp]` FAIL — build stamp leaked into output |
| Runtime `DateTime.now()` (legit id/audit content) | PASS by design — check is scoped to header bands, not whole files |
| Caret pattern later bumped to exact pins | No gate conflict; gates are pin-strategy agnostic |
| `expense.semantic_app` (no lock) | NOT a defect — it's a semantic-lane-only output with no Flutter project artifact; scoped out |

## 10. Architecture impact

Classification **C (data-flow/packaging) at the build boundary only**. S-HERMETIC does not touch
presentation, state, or navigation. It converts the C12 gap from "invisible drift risk" into
"governed artifact": the lockfile becomes reviewable-as-diff and gated. The one real architectural
footprint is the SDK-floor tightening in the output `pubspec.yaml` environment block — a packaging
constraint, not a runtime one.

Dimensions tested: none runtime (no Flutter on this box — excluded per brief). Assembly-level
evidence only (source + committed outputs + committed locks).

## 11. Cost/complexity

- Generator: **S** — one SDK-floor constant in `project.ts` line 51 + `persistence.ts` (unchanged
  carets); one stale-constant fix in `context.ts:37` (optional).
- IR/schema change: **none**.
- Validation: **S** — two regex/manifest gates + one field in the FAIL set (`validate.ts:1329`).
- Testing: **S–M** — negative controls: (i) a committed lockfile deleted → `[lockfile]` FAIL;
  (ii) a hand-inserted header date → `[timestamp]` FAIL; positivity on all 4 apps + samples
  untouched. No golden churn (no UI).
- Dev-loop impact: caret+lock keeps the normal `flutter pub get` workflow (create/delete stamps
  only change when the generator bumps a caret); exact pins would freeze transitive deps until the
  generator bumps them — the higher dev-loop cost.
- Determinism risk: none to L1; L2 risk reduced.
- **Benefit worth the cost: yes** — the repo already implicitly chose (b); the gaps are a
  validation gate, a floor constant, and two doc/record fixes, all S-sized.

## 12. Findings

1. **`pubspec.lock` files ARE committed and tracked** for all 4 committed apps and 5 of 6 sample
   outputs — the brief's "no committed lockfile" premise is false at HEAD. The actual gap is
   governance and provenance, not absence. (Corrects plan-§0's "no `pubspec.lock` is emitted by the
   compiler" — that is still TRUE: the *compiler* doesn't emit it; `flutter pub get` does, and the
   result was committed as a normal artifact.)
2. **Option (b) is therefore the de-facto state** and the correct final choice: pub reuses a
   still-satisfied lock, so a committed lock freezes the transitive graph (L2) — the only artifact
   that can. Exact pins (a) would pin only *direct* deps, still need a lock for transitives, and add
   the dev-loop cost of frozen transitive resolution until a generator bump — strictly worse.
3. **The shutdown-worthy drift is the SDK floor.** Generated `sdk: ^3.0.0` vs committed lock
   `dart >=3.11.0` / `flutter >=3.38.4` vs recorded toolchain Flutter 3.44.3/Dart 3.12.2. And
   `builder.lock.json` claims `localeDataVersion: intl-0.19.0` while ledgerly actually resolves
   `intl 0.20.2` — a live example of the defensive record contradicting reality.
4. **No timestamps anywhere in generated headers/metadata** — confirmation the §0 grep holds at
   every committed app; `DateTime.now()` exists only as legitimate runtime content (id-gen
   `naming.ts:45`, audit `audit.ts:61`), which a whole-file grep would wrongly flag.
5. **No `[lockfile]` and no `[timestamp]` gate exists** in `validate.ts` today (§3.5) — the
   timestamp-absence claim is literally "true only by absence of code that would break it", exactly
   as the plan warned.
6. **The Flutter toolchain record already exists** (`SWIFTUI_GROUND_TRUTH.md:91-93`) but is not
   linked/ratified for the Flutter path; no CI/fvm/.tool-versions exists to enforce it.

## 13. Decisions (3, CLOSED)

**D1 — Pin strategy: ADOPT option (b) = keep caret ranges + committed per-app `pubspec.lock`, and
REJECT option (a) exact pins.** Evidence §12.1-12.2: the repo already ships (b); only
governance is missing. Ranked dependency for pinning attention:
**1) the Flutter SDK floor `sdk: ^3.0.0`** in generated `pubspec.yaml` is the most consequential —
it's the platform the whole graph builds against and is far below the proven floor (→ adjust to the
recorded/toolchain-matching floor); **2) `go_router`** (resolved 17.5.0 from `^17.1.0`, largest
behaviorally-relevant CLI drift apart from the SDK floor) — lowest-resistance candidate to also
tighten toward a proven-good resolved version; **3) `dio`/`get_it`/`equatable`/`flutter_lints`**
resolved within caret since the lock was last built — governed by the lock, no action needed.

**D2 — Toolchain pin: ADOPT (document + ratify, no enforcement seam exists).** The target versions
are already recorded (`SWIFTUI_GROUND_TRUTH.md:91-93`: Flutter 3.44.3 stable / Dart 3.12.2 /
DevTools 2.57.0) and corroborated by every committed lock's `sdks:` (`dart >=3.11.0`,
`flutter >=3.38.4`). The missing piece is a Flutter-specific pin doc tying (a) the recorded
toolchain, (b) each committed app's lock `sdks:` floor, and (c) "re-verify with `flutter --version`
on any new build machine" into one reference, plus tightening the generated SDK floor to match.

**D3 — Timestamp absence: CONFIRM (already-true) + ADOPT the cheap `[timestamp]` regression gate.**
Every committed generated output has zero dates in header bands/metadata (§3.3); the runtime
`DateTime.now()` occurrences are intentional content. The regression check (§14.3) keeps this true
and is scoped to header bands to avoid false positives on runtime content.

## 14. Recommended implementation (S-sized)

### 14.1 Slice 1 — `[lockfile]` + `[timestamp]` gates in `validate.ts`
Two additive gates + two fields (`lockfile`, `timestamps`) in the FAIL sum (`validate.ts:1329`).
`[lockfile]`: assert the app output contains `pubspec.lock` and, when present, that its `sdks:`
floor is not *below* the declared toolchain floor (parse `pubspec.lock` `sdks:` block; log an
issue on mismatch instead of hard-FAIL for floor-differs, since older commit locks are historical).
`[timestamp]`: scan every `walk()`ed file's **header band** (first 4 comment/header lines before
the first `import`/`dependencies`) for `/\d{4}-\d{2}-\d{2}/` and `/generated on |Generated on | at \d{1,2}:\d{2}/`; never scan body lines. Negative controls: delete a lockfile → `[lockfile]` FAIL;
hand-insert `// generated 2026-08-18` into a header → `[timestamp]` FAIL; confirm an untouched app
PASSes both.

### 14.2 Slice 2 — SDK-floor + stale-constant fix (packaging)
`project.ts:51` `sdk: ^3.0.0` → a floor aligned to the recorded toolchain (e.g. `sdk: ^3.12.0` or
`>=3.11.0 <4.0.0`, **owner to ratify the exact value**); `context.ts:37` — replace the stale
`localeDataVersion: "intl-0.19.0"` with the resolved `intl` version from the committed lock (or
drop the claim and record resolved versions). Caret ranges stay.

### 14.3 Slice 3 — `FLUTTER_TOOLCHAIN.md` + decision-log entry
New doc (or a ratified section in `DETERMINISM_CONTRACT.md`): table of `flutter --version` /
`Dart …` / DevTools from `SWIFTUI_GROUND_TRUTH.md:91-93`, the per-app lock `sdks:` floors, the L1/L2
two-layer contract, and the "re-verify toolchain before any build" note. Log the owner call
("commit lockfile per app = policy") into SPIKE_PLAN decision log as a C12 closure.

### 14.4 Verification commands (implementer, on the Mac)
1. `npm run typecheck:builder`.
2. `npx ts-node --transpile-only builder/src/validate.ts <ir> <out>` for all 4 apps + samples after
   regenerate — `[lockfile]`/`[timestamp]` PASS.
3. Negative controls from §14.1 (delete-lock and hand-stamp) FAIL.
4. `flutter pub get` on one regenerated app → lock recreated, `diff` against the prior committed
   lock shows only the intended version ceiling change (if any).
5. `npm run pipeline` handful on the Mac (this box runs no builds).

## 15. Rejected alternatives

- **D1(a) exact pins (`^` dropped):** rejected — pins only direct deps (transitives still need a
  lock), freezes the generated-app dev loop until the generator bumps pins, and buys nothing the
  committed lock doesn't already provide. Two mechanisms, one (the lock) strictly covers both
  layers.
- **Whole-file `DateTime.now()` grep as the `[timestamp]` check:** rejected — false-positives on
  legitimate runtime id/audit content (`naming.ts:45`, `audit.ts:61`). The check must read header
  bands only.
- **CI-enforced toolchain pin:** rejected (defer) — no CI exists in-repo and Flutter runs on the
  Mac; inventing CI is out of scope. The doc + validate-gate seam is the enforceable surface today.
- **Regenerate every app to refresh all locks this slice:** rejected — churns 9+ committed
  lockfiles for no defect; refresh on the next natural regenerate.

## 16. Open questions

- Owner ratification: exact SDK floor value for generated pubspec (align to 3.12.2 record, or the
  looser `>=3.11.0` the lock proves?) — **owner call, decision-log item.**
- Should next lock-refresh be a scripted step (add `pub get && git add */pubspec.lock` to the
  Mac-side pipeline) so commits stay coherent, or remain manual? (Recommend scripted step on the
  Mac, matching the existing `pipeline` ceremony.)
- Is `localeDataVersion` worth keeping at all if the record is a stale-forever risk? (Option: drop
  the specific version, keep the strategy name.)
- Whether `[lockfile]` floor-differs should be error or warning severity (recommend warning for
  historical locks, error for missing).

## 17. Follow-up

- Report 3 CLOSED decisions + evidence to the orchestrator (Zen model) on Telegram
  (D1 ADOPT-(b)/REJECT-(a), D2 ADOPT, D3 CONFIRM+ADOPT).
- Capture a brief for the implementer: Slice 1 + 2 + 3 as one S-sized slice on a Flutter-capable
  box (Mac), verification per §14.4.
- This report lives under `design/flutter-app-builder/research/` (research archive; brief allowed it
  here once synced).
- Owner decision-log entry to add: "C12 CLOSED via S-HERMETIC — commit lockfile per app is policy;
  SDK floor to be ratified; toolchain record ratified at SWIFTUI_GROUND_TRUTH §1.5."