# S-P5/D2 — State-placement spike: implementation brief (for remote opencode agent)

> **Executor:** remote opencode agent (tracematrix). **Source:** `/root/fg-p5` (fresh clone of
> `https://github.com/aboodysa/flutter_generator.git`, HEAD `fd120d7`). **Type:** SPIKE —
> read-only, NO code edits, NO commits, per `design/flutter-app-builder/research/SPIKE_PROTOCOL.md`.
> Produce the §17 spike report + a decision at the end.

## Contract / plan to read first (in that order)
1. `design/flutter-app-builder/research/SPIKE_PROTOCOL.md` — binding spike rules (read-only,
   decide-first; output = ADOPT/MODIFY/REJECT/DEFER/SPLIT/ESCALATE + §17 report).
2. `design/flutter-app-builder/research/SPIKE_PLAN.md` §P5 ("P5 → merge with DESIGN_OPTS D1+D2"),
   and `§18 S-P5/D2` specific expectations.
3. `design/flutter-app-builder/research/INTERFACE_PATTERN_CONTRACT.md` §7.
4. `design/flutter-app-builder/research/DESIGN_OPTS.md` O6.1/O6.2/O6.3 (§17 Failure taxonomy).
5. `design/flutter-app-builder/research/GRILL_S0_REPLY.md` C11 (two placement owners + runtime error
   content source).

## Hypothesis
> "Formalizing the already-existing Loading/Error/Empty insertion point in `screen.ts` as a named,
> plan-recorded structural slot that is **state-model-conditional** (each screen renders exactly the
> triad members its own state model declares), plus composing an empty state with a 'New <Entity>'
> CTA and a retry/pull-to-refresh — improves the generated apps, stays deterministic, and lets a
> validator catch placement drift."

Test whether the proposal is worth implementing as written — you may conclude it needs change.

## Ground truth to establish (read BOTH source AND generated output)
- The current ad hoc placement in `builder/src/generators/screen.ts` (today at ~`:671-672`:
  `if (state.status == …loading) return const LoadingState(); if (…failure) return
  ErrorState(message: state.errorMessage);`). Confirm these reference `state.status`, which state
  model owns `status` (bloc `StateModel.status`? riverpod?).
- `builder/src/generators/components.ts` — `LoadingState`/`ErrorState`/`EmptyState` widgets
  (loc: ~`:212`+, from the earlier read they exist).
- `DESIGN_OPTS.md` D1 (`buildTheme()` wiring) — is it already implemented or not? (SPIKE_PLAN §P5
  says D1 + D2 "both unimplemented"; verify against `builder/src/generators/project.ts` and
  generated `lib/main.dart`.) D1 is a stated PREREQUISITE for D2.
- The state model per screen archetype: do ALL list/detail/form screens expose both `loading` and
  `failure` statuses? Does the `status` enum on every generated state include `loading`/`failure`
  (thus "empty" is a separate `items.isEmpty` check, not a status)? This is the crux of the
  "state-model-conditional" claim — prove it, don't assume.
- Generated output for a sample app (e.g. generate `apps/tasks/input/tasks.ir.json` into a scratch
  dir via `npx ts-node --transpile-only builder/src/index.ts`; inspect the real `_list_screen.dart`
  / `_detail_screen.dart`), so claims are grounded in output, not just generator source.

## Questions evidence must answer (SPIKE_PROTOCOL §6)
1. Is a Loading/Error/Empty triad universally applicable, or state-model-conditional (the ChatGPT
   round-2 edit #4 says the OKAMI-inspect contract: "each screen renders exactly the triad members
   its own state model declares; a state that [has no such member] renders [nothing]")? Does a
   counterexample exist in the samples (a screen whose state model lacks `failure`, or an
   empty-is-status model)?
2. Is the shared `statePlacementFor` + plan-recorded slot worth a validator, vs today's inline
   checks (which S-CTX already partly guards)? Cost/benefit.
3. Empty-state with a "New <Entity>" CTA when the repo has create — does reusing
   `crudFormTargets` (the P4 precedent) avoid a new heuristic? Where does the CTA navigate?
4. Retry `OutlinedButton` binding to the cubit's `load()` + `RefreshIndicator` — deterministic?
   Any new state/import needed? SM-agnostic (bloc + riverpod)?
5. Error copy from the existing Failure taxonomy (DESIGN_OPTS §17), never IR — confirm that source
   exists and is deterministic.
6. Can the `[states]`/extended gate flag a missing triad member without becoming a false heuristic
   (i.e. the validator must check the *applicable* contract per state model, not blindly require
   all three members on every screen — C4/C8/C11 trap)?

## Determinism / ownership / failure-mode (SPIKE_PROTOCOL §6-12)
- Inputs: IR screen + state model + repo ops. No IR/schema change proposed (verify none needed).
- Keep the single-owner posture: the decision belongs in `composition.ts` (like shellFor/searchFor/
  scrollFor/actionsFor) → plan.json → screen.ts renders → gate re-derives.
- Failure modes for: no applicable state member, unknown status, missing `items`, non-CRUD entity
  (no create → no CTA) — each must have a deterministic outcome (omit / fallback / gate error).

## Deliverable — §17 spike report
Produce `SPIKE_P5_D2_REPORT.md` under `/root/fg-p5` (or `design/flutter-app-builder/research/`
once synced) with all 17 sections, ending with ONE decision:
- ADOPT/MODIFY/REJECT/DEFER/SPLIT/ESCALATE, with evidence.
- If ADOPT/MODIFY: the recommended implementation (final semantic contract, state-model-conditional
  rule, selector, generator insertion point, validator, slices, test matrix) — generated from your
  evidence, not copied from the hypothesis.

## Constraints
- Read-only; NO `builder/src/**` edits, NO commits during research.
- Report the DECISION + key evidence to the orchestrator (Telegram/opencode return). Full report
  saved to a file.
- Small box (1vcpu/1gb): prefer reading + targeted greps + at most ONE scratch generation. Avoid
  heavy Flutter builds.
- If any step is blocked (missing remote repo, quota), say so and park — do not improvise the
  decision without the grounding.

Environment: repo already cloned at `/root/fg-p5` (public https, HEAD `fd120d7`). `npm ci` may be
needed for ts-node. Confirm idle channel before starting.
