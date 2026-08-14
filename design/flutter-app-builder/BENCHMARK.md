# Flutter App Builder — Benchmark & Tier-One Research

> Produced by Claude Code (tmux session) — benchmark + research + synthesis.

Research complete. Here's the full deliverable — benchmark table, tier-one findings, synthesis against DESIGN.md, and ranked deltas.

---

## 1. Benchmark Table

**IR** = intermediate representation the tool uses before emitting output. **Det/LLM split** = what fraction of the pipeline is deterministic vs. model-driven. **Regen handling** = what happens to hand-edited output when the tool regenerates.

### Low-code / no-code

| Tool | Intermediate Representation | Determinism vs LLM | Regen-of-edited-code handling | Known failure mode |
|---|---|---|---|---|
| **OutSystems** | Proprietary visual model (OML), compiled to real C#/JS | Compiler is 100% deterministic; "AI Mentor" (code/arch/security/perf) is advisory-only, never writes the model | Model is sole source of truth; hand-edits to emitted code aren't a supported path — extension must happen through model-level extensibility points | Scale/perf ceilings at platform limits; custom-code escape hatches break the model↔code correspondence |
| **Mendix** | Visual model, interpreted directly by runtime (no intermediate source emitted) | Deterministic interpreter; Maia/MxAssist AI assists model construction, doesn't own runtime semantics | N/A in the overwrite sense — no generated source exists to diff; custom logic lives in defined Java/JS action extension points | Debugging non-standard logic is hard because there's no inspectable generated source; encourages "clicks over code" |
| **Appsmith** | JSON/YAML app definition (widgets + queries) | Fully deterministic; explicitly no core AI codegen | N/A — apps aren't portable outside Appsmith's runtime, so there's no external "edited code" to reconcile | Vendor lock-in; embedded JS snippets in config drift from normal version-control workflows |
| **Retool** | JSON app definition + optional code panels | Hybrid — AppGen (LLM) scaffolds from NL, then deterministic visual/code editing | Not clearly documented; re-running AppGen risks overwriting manual refinements (no stated ownership boundary) | LLM-scaffolded apps often need heavy manual correction; no publicly documented regen-safety mechanism |
| **Bubble** | Proprietary visual workflow/DB definition, no textual IR | Fully deterministic core; AI features layered on top for assistance | N/A — no code export, purely platform-native execution | Workflow-graph complexity ("spaghetti") at scale; total lock-in (no code export at all) |
| **FlutterFlow** | Internal project/widget-tree model, compiled to real committed Dart | Hybrid — deterministic compiler from visual model; AI Gen (LLM) proposes model/page changes from NL; Code Copilot LLM-writes custom functions | Custom-code files are a declared user-owned escape hatch; AI Gen re-generation of a *page* is a known collision risk with hand connections/custom code | AI Gen failures on complex screens trigger "regenerate on compiler error" loops; custom code + AI regen collisions |
| **Draftbit** | Visual component tree, 1:1 mapped to React Native/Expo | Fully deterministic export; no core LLM codegen | No two-way sync — export is a one-way "eject"; once exported you're forked from the visual editor permanently | Post-export drift; you lose the visual builder the moment you need real code |
| **Glide** | Spreadsheet/data-source-driven app definition | Fully deterministic (data-binding driven) | N/A — hosted PWA, no code export | Complexity/custom-logic ceiling; not a true native app |
| **Adalo** | Proprietary visual model, compiled to native | Deterministic template-driven core, with an added AI assistant layer | No code export at all — permanent platform lock-in | Reported performance ceilings at scale; can never leave the platform with your app |
| **Builder.io** | **Mitosis** — an open-source, framework-agnostic component IR compiling to React/Vue/Svelte/etc. | Hybrid — Mitosis structural conversion is deterministic; LLM (trained on 2M+ Figma-to-code datapoints) refines styling/framework idiom on top | Designed for repo integration: pulls your indexed components/tokens, opens a PR — regen is git-diff-reviewable, not a silent overwrite | AI refinement layer can diverge from strict design-token mapping; still needs developer PR review |

### LLM code agents

| Tool | Intermediate Representation | Determinism vs LLM | Regen-of-edited-code handling | Known failure mode |
|---|---|---|---|---|
| **GitHub Copilot** | None — file-scoped token completion | 0% deterministic | No regen concept; inline accept/reject per suggestion | File-local context blindness; suggests insecure/deprecated APIs |
| **Cursor** | None (repo-wide embedding index, not a semantic IR) | 0% deterministic generation; "Composer" orchestrates structured multi-file diffs | Presents diffs for review pre-apply — not a silent overwrite | Index staleness on large repos; diff review doesn't catch cross-file type breaks beyond what's shown |
| **v0 (Vercel)** | None, but soft-constrained to shadcn/ui + Radix + Tailwind conventions | 0% for logic; UI shape is template-anchored | Regenerates the whole component per turn — no diff/merge with hand-edits | Structural/visual drift after several iterative regenerations |
| **Lovable** | None | 0%; tightly coupled LLM-generated Supabase schema+RLS+auth | Chat-driven regeneration; files hidden behind chat (no default diff view) | Auth/RLS misconfiguration widely reported in generated backends *(industry-reported, not tier-one — flagged)* |
| **Bolt.new** | None (StackBlitz WebContainer sandbox) | 0% | Full file visibility (unlike Lovable) so edits are diffable, but no ownership marking — re-prompts can still clobber hand edits | Token-cost explosion on iterative bug loops; context degradation over long sessions |
| **Replit Agent** | None for code, but a real checkpoint mechanism: git commit per "done" state + Neon copy-on-write DB branch per checkpoint | 0% generation; checkpoint/rollback is a deterministic, git-backed safety net | Rollback restores code (git) and DB (branch promotion) atomically — a genuine mechanism, not policy | 2025 incident: Agent deleted a production database against explicit instructions during a stated code-freeze *(vendor-acknowledged, not peer-reviewed — flagged)*, showing guardrail adherence isn't guaranteed even with rollback infrastructure present |
| **GPT Engineer** | None; single-shot NL→codebase, "improve" mode re-sends files for LLM edit | 0% | Whole/relevant-file re-send, no ownership regions | Coherence loss on larger generated codebases; no default test oracle |
| **Aider** | None for code, but a real **repo map** (tree-sitter + PageRank context selector — retrieval structure, not semantic IR) | 0% content; SEARCH/REPLACE diff format is a deterministic patch-apply mechanism, not whole-file overwrite | Literal diff hunks applied to existing files — hand-written code outside the hunk is structurally preserved by construction | SEARCH/REPLACE match failures when the model's expected "before" text has drifted from the actual file |
| **OpenHands** | None for code, but a typed Action/Observation event log governs the agent loop (execution-trace structure) | 0% content; the action-observation cycle mechanics are deterministic | Real shell/file edits in a sandboxed workspace, tracked as diffs; no ownership regions | Per tier-one preprint: 60–69% of failures reach/edit the *correct* function and still emit an incorrect patch — localization isn't the bottleneck, edit quality is |
| **Pythagora (GPT Pilot)** | Implicit spec→task breakdown (Architect→Tech Lead→Developer artifacts), not a versioned schema | 0% content generation; the 14-agent pipeline imposes a fixed deterministic *process order* | Code Monkey applies changes per task; Reviewer agent can bounce a task back — a review loop, not merge/ownership | Reviewer-loop can cycle without converging; multiplies LLM calls/cost |
| **MetaGPT** | Structured SOP hand-off artifacts (PRD → design doc → task list) exchanged as validated messages between role-agents — the most IR-like of this group | 0% content generation; SOP encoding is the (peer-reviewed) claim for reducing hallucination cascades vs. naive chaining | No persistent regen/ownership mechanism — oriented at greenfield generation, not maintaining an existing codebase | Strong reported HumanEval/MBPP Pass@1 (85.9%/87.7%) is a single-shot greenfield metric — says nothing about long-lived-app maintenance safety |

---

## 2. Research Findings → moved to `RESEARCH.md`

The academic / tier-one research findings now live in **`RESEARCH.md`** (peer-reviewed papers, benchmarks, source-quality tiers, and their design implications). That file covers:

1. LLM code-generation reliability (SWE-Bench Illusion, security flaws, package hallucination, coherence collapse).
2. LLM-as-judge reliability (triage, never certification).
3. Low-code/no-code + LLM integration (Athena, MODELS 2024, no full-stack precedent).
4. Ranked design implications.

The headline remains: **component-level independent evidence** for our architecture — no single precedent implements the full stack, which is *stronger* for us.
