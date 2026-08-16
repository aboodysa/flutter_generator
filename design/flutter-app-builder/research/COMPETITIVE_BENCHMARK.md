# Competitive Benchmark — Flutter App Builder vs. Lovable / FlutterFlow / Bolt.new / Replit / v0

> Status: 2026-08-16 · Research spike · **No web search** (unavailable in this env) — written from
> model knowledge of the 2026 competitive landscape + this repo's `ROADMAP.md` (P1–P13) and
> `CAPABILITIES.md`. Vendor facts (features, incidents, positioning) are directionally correct but
> **not freshly verified**; treat specifics as estimates. Pairs with the tier-one evidence in
> `RESEARCH.md` and the tool table in `BENCHMARK.md`. "Us" columns are grounded in `DESIGN.md`,
> `ROADMAP.md`, and `CAPABILITIES.md`.

---

## 1. TL;DR

The market is still split into the same two camps `EXECUTIVE_OVERVIEW.md` describes, and 2026 has
hardened both sides rather than merging them:

- **Deterministic platforms** (FlutterFlow, plus the low-code tier behind it) — reliable
  compilation from a visual model, but their AI is advisory or a page-level model editor; custom
  code is an escape hatch that collides with regeneration.
- **LLM-first agents** (Lovable, Bolt.new, Replit Agent, v0) — fastest to a demo, but generate
  unverified code, lose context over long sessions, and cannot safely regenerate over human edits.

**Nobody occupies the middle.** Flutter App Builder's position — deterministic `(IR, ctx) → string`
compiler + a human-approved semantic lane + hash-verified regeneration — is still unclaimed. Every
major tool moved *toward* LLM-first generation in 2025–26 (Lovable added a canvas; Bolt went
agent-first; v0 went full-stack); **none added a correctness oracle, none added an audited regen
merge, none bounded the LLM with write-ACLs.** That asymmetry is the whole thesis of this report,
and it still holds.

---

## 2. Method & confidence

| Input | Use | Confidence |
|---|---|---|
| Model knowledge of 2026 vendor state | `§3` profiles, `§4` scorecard | Medium — directional, unverified |
| `ROADMAP.md` P1–P13, `CAPABILITIES.md`, `DESIGN.md` | "Us" columns, gap table `§6` | High |
| `RESEARCH.md` tier-one findings | Verification/regen/security claims | High — peer-reviewed where cited |

Vendor incidents quoted (Replit DB deletion 2025, Lovable RLS misconfig, v0 regen drift) are widely
reported but **not tier-one** — flagged, consistent with `BENCHMARK.md`'s source-quality legend.

---

## 3. Field profiles (2026 state)

### 3.1 Lovable
The chat-driven full-stack app builder (ex-GPT Engineer). Generates **React/Vite/Tailwind + Supabase
backend** (schema, auth, Row-Level-Security) entirely from prompt-driven regeneration; added a
visual **canvas** to hand control back to the user, but the model still owns the app's structure.
Hosts on its own cloud; strong acquisition funnel; multiple funding rounds through 2025.
- **Regen handling:** chat-driven; no ownership regions; hand edits live alongside regenerated
  files with no merge. Initially files were hidden behind chat; a diff/code view now exists, but
  regeneration still re-assembles whole areas rather than merging.
- **Correctness:** none beyond build-success. Auth/RLS misconfig is its most-reported defect class —
  a permission bug is *silent* until a later exploit, exactly the failure `[oracle]`/security gates
  exist to catch.
- **Business rules:** encoded as natural-language instructions re-applied on regeneration; no
  closed rule language, no executable verdicts (unknown to them: `DESIGN.md` §19, `L2 PolicyVerdict`).

### 3.2 FlutterFlow
The closest *framework*-level competitor — **compiles a visual widget/model tree to real,
committed Dart**, exactly the target output of this generator. AI Gen proposes widget-tree changes
from NL prompts; Code Copilot lets the LLM write custom Dart functions.
- **Regen handling:** custom-code files are the declared user-owned escape hatch; AI Gen
  regeneration of a *page* is a known collision risk with hand wiring/custom code. No content-hash
  ownership map, no audited merge (`RESEARCH.md` §3.3: "region preserved is asserted, not proven").
- **Correctness:** the compiler is deterministic, but nothing verifies *business* correctness; the
  AI-written custom functions carry no oracle.
- **Data/lane:** Firebase/Supabase defaults — cloud-first, not local-first.

### 3.3 Bolt.new
StackBlitz's web-dev agent running in **WebContainers** (Node in the browser). Builds full-stack
web apps (React/Vite + Tailwind, optional Supabase) from prompts, with a real file tree and diffs;
steady funding and an enterprise track in 2025–26.
- **Regen handling:** full file visibility (unlike Lovable) means edits are *diffable*, but there's
  no ownership marking — re-prompts can still clobber hand edits.
- **Reliability economics:** token-cost explosion on iterative bug loops; context degradation over
  long sessions produces coherence collapse (`RESEARCH.md` §1.4 — 60–69% of agent failures reach
  the right function and still corrupt the patch). Expensive per shipped feature.

### 3.4 Replit Agent
The most infra-complete agent: a **checkpoint mechanism** (git commit per milestone + Neon
copy-on-write DB branch) is a genuinely deterministic safety net — rollback restores code and DB
atomically. Agent-v3-class: scaffolds from scratch to deployed app on Replit Deployments.
- **Regen handling:** the *only* competitor with a real rollback mechanism — but it's a "restore
  to a past state" safety net, not an ownership/merge policy for forward regeneration.
- **Trust-boundary reality:** the 2025 production-DB-deletion incident during a stated code-freeze
  shows rollback present ≠ guardrail adherence. No write-ACL, no human-approval gate on destructive
  operations.

### 3.5 v0 (Vercel)
The design-focused agent. UI is template-anchored to **shadcn/ui + Radix + Tailwind** — the
strongest default visual quality in the field; 2025–26 added full-stack React (Next.js) generation
and team/enterprise features.
- **Regen handling:** regenerates the whole component per turn — no diff/merge with hand edits;
  structural drift after a few iterations is the known artifact.
- **Scope:** strongest at *screens*, weakest at durable app logic, data-modeling depth, and
  business rules.

### 3.6 The common denominator (2026)
All five moved further toward LLM-first generation; **none** shipped:
1. an executable correctness oracle for business rules,
2. a hash-verified regeneration merge,
3. an LLM write-ACL into the artifact,
4. deterministic output that can be byte-compared across runs,
5. a curated, allowlist-driven dependency policy.

These five absences are, one for one, the five pillars `DESIGN.md`/`ROADMAP.md` build on.

---

## 4. Feature-parity scorecard

Legend: ✅ yes · 🟡 partial/claimed · ❌ no/not documented. **Us** = deterministic core +
`ROADMAP.md` P1–P13 intent (not all shipped yet; the roadmap phase is in parentheses).

| Dimension | Lovable | FlutterFlow | Bolt.new | Replit Agent | v0 | **Us (phase)** |
|---|---|---|---|---|---|---|
| Output framework | React+Supabase | **Flutter (Dart)** | React/Vite | Any (deploys) | React/Next | **Flutter (Dart)** |
| Deterministic compile core | ❌ | ✅ | ❌ | ❌ | ❌ | ✅ |
| LLM writes only validated IR | ❌ | 🟡 (AI edits model) | ❌ | ❌ | ❌ | ✅ + approve gate |
| Regen-safe merge of hand edits | ❌ | 🟡 (custom-code owned) | 🟡 (diffable) | 🟡 (rollback, not merge) | ❌ | ✅ region hash; 3-way `P5-E1` |
| Business-rule correctness oracle | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ `<rule>.oracle.json` |
| Security validator gates | 🟡 (RLS) | 🟡 | ❌ | ❌ | ❌ | ✅ `[money]/[secrets]/[oracle]/[payments]` |
| Curated dependency allowlist | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ DESIGN §20 |
| Generated unit/widget/flow tests | 🟡 | 🟡 | ❌ | ❌ | ❌ | ✅ + goldens + CDP flow `P6-F3` |
| Closed rule language + verdicts | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ §19, `L1/L2` |
| Local-first / offline persistence | ❌ (cloud) | ❌ (cloud default) | ❌ (cloud default) | 🟡 | ❌ | ✅ `P6-F2` (sql/nosql) + outbox `MF6` |
| Backend from same spec | ✅ (Supabase) | 🟡 (Firebase/Supabase) | ✅ (Supabase) | ✅ (hosted) | 🟡 (Next) | ✅ `P9` NestJS from same IR |
| Multi-role / tenant scoping | 🟡 (RLS) | 🟡 | ❌ | ❌ | ❌ | ✅ `MF2` tenantId+actorId |
| Approval / workflow engine | ❌ | 🟡 | ❌ | ❌ | ❌ | ✅ `L5/C1/C2`, state-machine gen |
| Multi-step wizard / branching | ❌ | 🟡 | ❌ | ❌ | ❌ | ✅ `P8` archetype + guards |
| Audit trail + immutable export | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ `L3` AuditEvent, CSV/JSON |
| l10n / RTL generation | 🟡 | 🟡 | ❌ | ❌ | 🟡 | ✅ `L4` AR/EN + RTL |
| Money-as-int / currency VO | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ `L1` `[money]` forbids double |
| Determinism (byte-stable output) | ❌ | 🟡 | ❌ | ❌ | ❌ | ✅ `npm run validate:gen` |
| Capability registry / manifest | ❌ | 🟡 (marketplace) | ❌ | ❌ | ❌ | ✅ `P10/P10.5` |
| Instant live preview | ✅ | ✅ | ✅ (WebContainer) | ✅ | ✅ | 🟡 CFT/CDP only (gap G3) |
| One-click deploy / hosting | ✅ | ✅ | 🟡 | ✅ | ✅ | 🟡 Tailscale expose only (gap G5) |
| Time-to-simple-app (minutes) | ✅ | ✅ | ✅ | ✅ | ✅ | 🟡 IR→app minutes; NL→IR adds approve gate (gap G1) |
| Cross-platform mobile+desktop | 🟡 (PWA) | ✅ | ❌ (web) | 🟡 | ❌ (web) | ✅ Flutter native all platforms |

Score read: we are competitive where it counts most and weakest exactly where 2026 consumers default
to — **speed-to-demo, live preview, and one-click deploy**. Those three gaps (`§6`) are the ones
that make us lose a *first* impression; none of them threaten the moat (regen safety, oracle, trust
boundary), which is what makes us *survive* a real product build.

---

## 5. Head-to-head on the moat

### 5.1 Regeneration safety — the decisive axis
Every competitor's most-reported complaint is the same: "I fixed it, then regenerated, and my fix
is gone" (FlutterFlow AI-Gen page collisions, v0 whole-component regen, Lovable chat-driven
rebuilds, Bolt re-prompt clobber). The field treats this as UX friction; we treat it as a
**hard correctness property**:

- Generated output is stamped `// [generated] generator=… ownership=generated` (`AGENTS.md` non-
  negotiable #6), so ownership is machine-readable, not a convention.
- User regions are preserved by **content-hash** (`regions.json`) — a human edit inside a
  generated region is detected, not silently overwritten.
- `P5-E1` adds a true **3-way merge** for scaffold migration — the missing piece even
  `BENCHMARK.md`'s builder.io entry only gestures at ("pulls a PR", not an audited merge).
- `RESEARCH.md` §3.3: the tools with LLM-writes-into-structure (FlutterFlow, Builder.io) "cite
  regen-vs-hand-edit collision as their most visible failure mode, and neither publishes an audited
  merge algorithm." We are not copying prior art; we fill the acknowledged gap.

Replit Agent is the closest conceptually (its rollback is real), but rollback is a *past-state
restore* — it discards forward work rather than preserving it. Ownership regions are strictly more
useful: you keep both the regeneration **and** your edit.

### 5.2 Correctness — oracle vs. "it looks right"
The LLM-first camp's definition of done is "the preview renders." That is a UI check, not a
correctness check:

- Lovable ships RLS that *may* be wrong — silent until the permission exploit.
- Bolt/Replit/v0 ship business rules as prose re-fed to the model — every regeneration re-lotteries
  the logic.
- We gate every business rule behind a **blocking oracle** (`<rule>.oracle.json`, ≥1 case,
  `validate.ts [oracle]` gate, `AGENTS.md` #4). A rule with zero verified cases **fails
  validation** — the same loud-failure posture `[money]` takes on `double`, and the posture
  `ROADMAP.md` P12 explicitly extends to payments (no silent mock fallback in prod).
- `RESEARCH.md` §2.2: executable tests beat LLM judges (62.5% judge/human agreement, 9.5% direct
  contradiction). Oracle cases are executable tests of intent — the only verification any of the
  five has ever had, and none of them have it.

### 5.3 Trust boundary — who decides?
- Field: the model decides, end to end (prompt → code → merge → deploy).
- Us: the model produces **schema-validated IR / `RuleModel`** in the semantic lane only
  (`builder/src/requirements.ts`, `business_rule_agent.ts`); every LLM-inferred element is stamped
  `origin=llm-inferred, requiresApproval=true` and generation **refuses** until
  `builder/src/approve.ts` attests `actor=human:attested` (`AGENTS.md` #5, DESIGN §9.4–9.5).
- Replit's incident is the proof the field's approach needs a gate: infra that *can* roll back did
  not stop a destructive act. A write-ACL + approval gate would have. P13 codifies this as a
  specialized-agent workflow with a stage gate, formalizing "code compiles is not done."

### 5.4 Determinism & economics
- Same IR → same bytes, every time (`validate:gen` determinism gate). This makes tests, goldens,
  and the P10-G5 **golden impact report** meaningful; a competitor run can't be replayed.
- Bolt's token explosion and Lovable's long-context degradation mean per-feature cost scales with
  *retry count*, not feature size. Our determinism makes cost predictable and CI-able. The P10
  manifest + decision trace (`P10-G3/G4`) turn every build into an auditable artifact — a property
  enterprise buyers specifically ask for.

### 5.5 Supply chain
`RESEARCH.md` §1.3: 5.2% (commercial) / 21.7% (open-source) hallucinated-package rate across 16
LLMs. The field resolves dependencies inside the prompt; we resolve from a **curated allowlist**
(DESIGN §20) pinned by a lockfile. Not a selling point anyone will demo — but a real reliability
difference that shows up in `flutter analyze` never failing on a phantom package.

---

## 6. Where competitors beat us today (gaps → roadmap)

Honest list, mapped to what we have planned. These are the "they win the demo" items.

| Gap | Competitor baseline | Our status | Roadmap response |
|---|---|---|---|
| **G1 Time-to-app** | Chat → deployed in minutes (all five) | IR authoring is deliberate; NL→IR goes through RequirementAgent + approve gate | `builder/src/server.ts` (:8787 `POST /requirements`, `/generate/full`) already exists — needs a thin client + demo persona so "describe → approve → app" feels instant; P13's missions formalize the human step as a feature, not a cost |
| **G2 Live preview loop** | Instant browser preview while prompting | We verify post-hoc via CFT/CDP (`PLAN_RUN_TEST_CFT.md`) — correct but not interactive | Keep CFT as the *gate*; add a watch-mode preview (`flutter run -d web-server` on regenerate) as the *feel* — lowest-cost parity |
| **G3 One-click deploy** | Hosted deploys (Lovable, Replit, Vercel) | Tailscale-only expose (AGENTS §13) | P9 backend + a `deploy.sh`/manifest per app; Tailscale stays the demo channel, not the product answer |
| **G4 Visual default quality** | v0/FlutterFlow design polish out of the box | Composition + theme exist (D1 landed); goldens render real Roboto text | P11 D2–D4 (CTA/feedback, breadth, motion/a11y) + the three-tier `[ux]` linter — this closes the "doesn't look like a designer did it" gap that none of our technical strengths compensate for in a screenshot |
| **G5 Ecosystem/marketplace** | FlutterFlow marketplace, Bolt.diy forks, huge prompt libraries | None | P10.5 capability registry is the seed of a shareable capability catalog; treat the registry as the future marketplace surface, not an internal doc |
| **G6 Model breadth** | Users can pick GPT/Claude/Gemini | Fixed to `opencode/deepseek-v4-pro` for agent calls (semantic lane) | Keep deterministic core model-agnostic (it is); model choice only ever affects IR quality, which the oracle gate neutralizes — position this as a *feature* (vendor-lockout) |

Reading: G1–G3 are presentation-layer losses — they cost first impressions. G4 is the one genuine
product-quality gap (screenshots are the field's marketing). G5/G6 are moat-adjacent but not
threatening. **None of the six touches the moat** (regen safety, oracle correctness, trust
boundary); all six are attainable with additive work already on the roadmap.

---

## 7. Capability catalog vs. competitors (CAPABILITIES.md L1–C2, MF1–MF6)

The catalog is the honest comp: each capability is app-type-agnostic and every new slice ships
schema + validator + generator + tests + determinism check (`ROADMAP.md` DoD #8). Here's who else
can even approach each row.

| Cap | What it is | Closest competitor answer | Gap they have | We have |
|---|---|---|---|---|
| **L1** Money-as-int + currency VO | typed money, never double | none — money is a `float` in every generated schema | silent rounding/exchange bugs | ✅ `money.v1` + `[money]` gate |
| **L2** Rule engine `PolicyVerdict` | severity + waivable verdicts on save/submit | none — rules are prompt prose | every regen rerolls the logic | ✅ `RuleModel` + oracle-gated eval |
| **L3** Audit + immutable export | who/what/before/after; no silent edits post-export | none | nothing to audit | ✅ `AuditEvent` + CSV/JSON export |
| **L4** l10n + RTL | AR/EN arb, per-locale formats | 🟡 hand-set in FlutterFlow; none in LLM-first tools | RTL is a post-hoc fix | ✅ generated l10n + RTL goldens |
| **L5** Workflow engine | multi-step wizard, guards, branching | 🟡 Bolt/v0 can scaffold a wizard page | page ≠ enforced state machine | ✅ `P8` archetype + `RuleModel` guards |
| **MF1** Multi-feature IR | `features[]` → folders + shared core | ❌ single-prompt whole-apps only | no modular integration | ✅ feature-first, shared core, merged router/DI |
| **MF2** Auth + roles + tenant scope | demo personas, tenantId/actorId on every read/write | 🟡 Lovable RLS (the flaky kind); Supabase in Bolt | RLS is hand-generated SQL, misconfig-prone | ✅ generated tenant scoping everywhere |
| **MF3** Attachment + OCR port | media capture stub + `OcrPort` interface | ❌ | ❌ | ✅ planned (`MF3`) — interface-first, offline-safe |
| **MF4** Split / allocation | amount-or-% summing to exactly 100%, audited | ❌ none | ❌ | ✅ `split.v1` (`split_core.v1` emitted) |
| **MF5** Budget / quota | entity + live remaining (committed vs actual) | ❌ none | ❌ | ✅ planned (`MF5`) |
| **MF6** Offline outbox | local-first queue, retry/backoff, conflict rule | ❌ cloud-only architectures | offline is not a mode they model | ✅ planned (`MF6`) against `P6-F2` persistence |
| **C1** Approval graph | multi-level, thresholds, delegate | ❌ none | ❌ | ✅ planned (`C1`) |
| **C2** Multi-role UI patterns | persona-aware home, inbox, batch approve | 🟡 Lovable-ish dashboards only | cosmetic, not role-enforced | ✅ planned (`C2`) |

**Reading:** for every capability that is anything more than a rendered page, the field has no
answer at all — their parity is limited to "a screen with a form on it." The `CAPABILITIES.md` set
is exactly the suite of things a business app needs and a prompt-to-preview tool doesn't produce.
This is the second pillar of the go-to-market (after regen safety): **sell the catalog, not the
screens.**

### 7.1 Lessons worth stealing (honest)

| From | What's genuinely good | Adopt as |
|---|---|---|
| v0 | default visual polish (shadcn-grade) | P11 D2–D4 + `[ux]` linter — make every generated screen *look* designed |
| Bolt | full file visibility / diffable generated output | already ours (generated files are plain Dart in a repo); keep the golden-impact report honest |
| Replit | rollback/checkpoint as a first-class safety net | already superseded by region-preserving merge, but the *disaster-story* (DB deletion) is the marketing material we can cite as "why write-ACLs" |
| Lovable | instant cloud iteration + never-make-the-user-touch-a-terminal | G1–G3 sprint (server.ts API + preview + deploy + Tailscale demo) |
| FlutterFlow | visual editing ergonomics for *layout* | explicitly **not** to chase (a visual-model editor is a whole product); cherry-pick only its landing-page polish |

---

## 8. Strategic conclusions

1. **The moat is still uncontested.** One year of market motion moved everyone *toward* LLM-first
   and *away* from the reliability properties we're built on. No 2026 entrant ships an oracle, a
   regen merge, or a write-ACL. `EXECUTIVE_OVERVIEW.md`'s "nobody occupies the middle" is *more*
   true in 2026 than when it was written.

2. **Lead with the only demo none of them can fake.** Regeneration safety is the one thing the
   whole field is complained about. A single scripted demo — (a) generate, (b) human edits a file,
   (c) regenerate, (d) the edit survives via `regions.json` — is worth more than any feature
   comparison, because it is the literal behavior every competitor has been asked for and failed.

3. **Pair the moat with a G1–G3 sprint** so the demo doesn't die at "how do I see it / deploy it."
   The CFT/CDP harness (P2/P6) already gives us a credible live-drive; wrap it with the web-server
   preview and the IR→app path to close the first-impression gap without touching determinism.

4. **Kill on the "enterprise trust" frame.** Compliance-averse buyers (finance, HR, gov — exactly
   the `CAPABILITIES.md` sample set) are the *only* segment where reliability outweighs speed. The
   P10 manifest, P10-G5 golden impact, P13 stage-gate missions, and the `[money]/[oracle]/[payments]`
   gates are directly marketable to that segment; none of the five can answer "prove the rule is
   right" or "prove the regen kept my change."

5. **Be the honest player.** Every claim in this file that we make about ourselves must stay
   verifiable: determinism gate, oracle gate, golden impact, generated-header ownership. The moment
   the marketing overstates what `validate.ts` actually enforces, the entire positioning ("we're
   the ones who don't lie") collapses. `ROADMAP.md` P10-G2's `GENERATOR_CONTRACT.md` is the
   enforcement doc for this.

6. **Do not chase FlutterFlow on the visual-model axis.** It owns the widget-tree-editing workflow
   and we never will; our IR is a compile target, not a drag-and-drop surface. Compete on what a
   visual model cannot express — business rules, policy verdicts, workflows, audit, multi-tenant
   scoping — the `CAPABILITIES.md` catalog is precisely the list of things no visual-builder
   handles well at scale.

---

## 9. Confidence & verification notes

- **Vendor rows** (features, incidents, positioning) are from model knowledge, not live sources —
  directionally reliable, precise numbers should be re-verified before any external use.
- **Our rows** are checkable in-repo: `ROADMAP.md` (phases cited), `CAPABILITIES.md` (L1–C2),
  `DESIGN.md` (§19 rule language, §20 allowlist, §11 merge), `RESEARCH.md` (§1.3 packages, §1.4
  coherence collapse, §2.2 judges, §3.3 regen), `BENCHMARK.md` (tool table), `EXECUTIVE_OVERVIEW.md`
  (positioning).
- This document is analysis only; **no code changed** and none is implied. If it drives roadmap
  decisions, fold its G1–G3 items into `ROADMAP.md` as new slices rather than re-scoping existing
  phases.
- Next spike candidates: (1) re-verify vendor facts with web search when available; (2) produce a
  scripted "regeneration-safety demo" runnable against a sample IR; (3) price-per-feature model
  comparing deterministic vs. LLM-first costs.
